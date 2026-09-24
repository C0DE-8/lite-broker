const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const accountBalances = new Set(["main_balance", "profit_balance", "investment_balance"]);
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

async function accrue(connection, miner) {
  if (miner.status !== "running" || !miner.last_accrued_at) return;
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(miner.last_accrued_at).getTime()) / 1000));
  const seconds = Math.min(elapsed, Number(miner.battery_seconds_remaining));
  if (!seconds) {
    if (!Number(miner.battery_seconds_remaining)) await connection.query("UPDATE user_miners SET status='depleted',last_accrued_at=NULL WHERE id=?", [miner.id]);
    return;
  }
  const earned = Number((Number(miner.hourly_earning) * seconds / 3600).toFixed(4));
  const [[before]] = await connection.query("SELECT mining_balance FROM users WHERE id=? FOR UPDATE", [miner.user_id]);
  const newBalance = round2(Number(before.mining_balance) + earned);
  const balanceCredit = Number((newBalance - Number(before.mining_balance)).toFixed(2));
  await connection.query("UPDATE users SET mining_balance=mining_balance+? WHERE id=?", [balanceCredit, miner.user_id]);
  await connection.query("UPDATE user_miners SET battery_seconds_remaining=battery_seconds_remaining-?,status=IF(battery_seconds_remaining<=?,'depleted','running'),last_accrued_at=IF(battery_seconds_remaining<=?,NULL,DATE_ADD(last_accrued_at, INTERVAL ? SECOND)) WHERE id=?", [seconds,seconds,seconds,seconds,miner.id]);
  await connection.query("INSERT INTO mining_transactions (user_id,miner_id,type,amount,mining_balance_after,note) SELECT ?,?,'earning',?,mining_balance,? FROM users WHERE id=?", [miner.user_id, miner.id, earned, `Equipment hourly accrual: ${seconds} seconds`, miner.user_id]);
}

router.get("/levels", auth, async (_req, res) => {
  try {
    const [levels] = await db.query("SELECT id,name,description,power_watts,price,hourly_earning,battery_hours,battery_price,is_active,sort_order FROM mining_levels WHERE is_active=1 ORDER BY sort_order,id");
    res.json({ levels });
  } catch (error) { console.error("[mining.levels]", error); res.status(500).json({ message: "Unable to load mining levels" }); }
});

router.get("/me", auth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [miners] = await connection.query("SELECT m.*,l.name AS level_name,l.power_watts,l.hourly_earning,l.battery_hours,l.battery_price FROM user_miners m JOIN mining_levels l ON l.id=m.level_id WHERE m.user_id=? ORDER BY m.id DESC FOR UPDATE", [req.user.id]);
    for (const miner of miners) await accrue(connection, miner);
    const [[user]] = await connection.query("SELECT mining_balance,main_balance,profit_balance,investment_balance,currency_symbol FROM users WHERE id=?", [req.user.id]);
    const [updated] = await connection.query("SELECT m.*,l.name AS level_name,l.power_watts,l.hourly_earning,l.battery_hours,l.battery_price FROM user_miners m JOIN mining_levels l ON l.id=m.level_id WHERE m.user_id=? ORDER BY m.id DESC", [req.user.id]);
    const [history] = await connection.query("SELECT * FROM mining_transactions WHERE user_id=? ORDER BY id DESC LIMIT 50", [req.user.id]);
    await connection.commit(); res.json({ balances: user, miners: updated, history });
  } catch (error) { await connection.rollback(); console.error("[mining.me]", error); res.status(500).json({ message: "Unable to load mining account" }); }
  finally { connection.release(); }
});

router.post("/equipment", auth, async (req, res) => {
  const levelId = Number(req.body.level_id), connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[level]] = await connection.query("SELECT * FROM mining_levels WHERE id=? AND is_active=1 FOR UPDATE", [levelId]);
    const [[user]] = await connection.query("SELECT main_balance,withdraw_hold FROM users WHERE id=? FOR UPDATE", [req.user.id]);
    if (!level) { await connection.rollback(); return res.status(400).json({ message: "Mining level is unavailable" }); }
    if (!user || Number(user.main_balance)-Number(user.withdraw_hold||0) < Number(level.price)) { await connection.rollback(); return res.status(400).json({ message: "Insufficient available main balance for this equipment" }); }
    await connection.query("UPDATE users SET main_balance=main_balance-? WHERE id=?", [level.price,req.user.id]);
    const [created] = await connection.query("INSERT INTO user_miners (user_id,level_id,status,battery_seconds_remaining) VALUES (?,?, 'stopped',0)", [req.user.id,level.id]);
    const [[after]] = await connection.query("SELECT mining_balance FROM users WHERE id=?", [req.user.id]);
    await connection.query("INSERT INTO mining_transactions (user_id,miner_id,type,amount,mining_balance_after,note) VALUES (?,?,'equipment_purchase',?,?,?)", [req.user.id,created.insertId,-Number(level.price),after.mining_balance,`Purchased ${level.name}`]);
    await connection.commit(); res.status(201).json({ message: `${level.name} purchased`, miner_id: created.insertId });
  } catch (error) { await connection.rollback(); console.error("[mining.equipment]", error); res.status(500).json({ message: "Unable to purchase equipment" }); }
  finally { connection.release(); }
});

router.post("/miners/:id/battery", auth, async (req, res) => {
  const minerId = Number(req.params.id), connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[miner]] = await connection.query("SELECT m.*,l.battery_hours,l.battery_price FROM user_miners m JOIN mining_levels l ON l.id=m.level_id WHERE m.id=? AND m.user_id=? FOR UPDATE", [minerId,req.user.id]);
    const [[user]] = await connection.query("SELECT main_balance,withdraw_hold,mining_balance FROM users WHERE id=? FOR UPDATE", [req.user.id]);
    if (!miner) { await connection.rollback(); return res.status(404).json({ message: "Miner not found" }); }
    if (Number(user.main_balance)-Number(user.withdraw_hold||0) < Number(miner.battery_price)) { await connection.rollback(); return res.status(400).json({ message: "Insufficient available main balance for a battery" }); }
    if (miner.status === "running") {
      const [[rate]] = await connection.query("SELECT hourly_earning FROM mining_levels WHERE id=?", [miner.level_id]);
      await accrue(connection, { ...miner, hourly_earning: rate.hourly_earning });
      const [[current]] = await connection.query("SELECT status,battery_seconds_remaining FROM user_miners WHERE id=?", [minerId]);
      if (current.status === "depleted") { await connection.rollback(); return res.status(400).json({ message: "Battery depleted. Purchase a battery before adding runtime." }); }
    }
    await connection.query("UPDATE users SET main_balance=main_balance-? WHERE id=?", [miner.battery_price,req.user.id]);
    await connection.query("UPDATE user_miners SET battery_seconds_remaining=battery_seconds_remaining+?,status=IF(status='running','running','stopped'),last_accrued_at=IF(status='running',NOW(),NULL) WHERE id=?", [Number(miner.battery_hours)*3600,minerId]);
    const [[after]] = await connection.query("SELECT mining_balance FROM users WHERE id=?", [req.user.id]);
    await connection.query("INSERT INTO mining_transactions (user_id,miner_id,type,amount,mining_balance_after,note) VALUES (?,?,'battery_purchase',?,?,?)", [req.user.id,minerId,-Number(miner.battery_price),after.mining_balance,`Battery: ${miner.battery_hours} hours`]);
    await connection.commit(); res.json({ message: "Battery purchased and runtime added" });
  } catch (error) { await connection.rollback(); console.error("[mining.battery]", error); res.status(500).json({ message: "Unable to purchase battery" }); }
  finally { connection.release(); }
});

router.patch("/miners/:id/state", auth, async (req, res) => {
  const minerId = Number(req.params.id), action = String(req.body.action||""), connection = await db.getConnection();
  if (!["start","stop"].includes(action)) return res.status(400).json({ message: "Choose start or stop" });
  try {
    await connection.beginTransaction();
    const [[miner]] = await connection.query("SELECT m.*,l.hourly_earning FROM user_miners m JOIN mining_levels l ON l.id=m.level_id WHERE m.id=? AND m.user_id=? FOR UPDATE", [minerId,req.user.id]);
    if (!miner) { await connection.rollback(); return res.status(404).json({ message: "Miner not found" }); }
    if (action === "stop" && miner.status === "running") await accrue(connection, miner);
    if (action === "start") {
      if (!Number(miner.battery_seconds_remaining)) { await connection.rollback(); return res.status(400).json({ message: "Battery depleted. Purchase a battery to run this miner." }); }
      await connection.query("UPDATE user_miners SET status='running',last_accrued_at=NOW(),started_at=COALESCE(started_at,NOW()),stopped_at=NULL WHERE id=?", [minerId]);
    } else await connection.query("UPDATE user_miners SET status='stopped',last_accrued_at=NULL,stopped_at=NOW() WHERE id=?", [minerId]);
    await connection.commit(); res.json({ message: action === "start" ? "Miner started" : "Miner stopped" });
  } catch (error) { await connection.rollback(); console.error("[mining.state]", error); res.status(500).json({ message: "Unable to update miner" }); }
  finally { connection.release(); }
});

router.post("/transfer", auth, async (req, res) => {
  const target = String(req.body.balance_key||""); const amount = Number(req.body.amount); const value = Number.isFinite(amount) ? round2(amount) : 0;
  if (!accountBalances.has(target) || value <= 0) return res.status(400).json({ message: "Choose a balance and enter a positive amount" });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[user]] = await connection.query("SELECT mining_balance,main_balance,profit_balance,investment_balance FROM users WHERE id=? FOR UPDATE", [req.user.id]);
    if (!user || Number(user.mining_balance) < value) { await connection.rollback(); return res.status(400).json({ message: "Insufficient mining balance" }); }
    await connection.query(`UPDATE users SET mining_balance=mining_balance-?, ${target}=${target}+? WHERE id=?`, [value,value,req.user.id]);
    const [[after]] = await connection.query("SELECT mining_balance FROM users WHERE id=?", [req.user.id]);
    await connection.query("INSERT INTO mining_transactions (user_id,type,amount,mining_balance_after,account_balance_key,note) VALUES (?,'transfer',?,?,?,?)", [req.user.id,-value,after.mining_balance,target,`Transferred ${value.toFixed(2)} to ${target}`]);
    await connection.commit(); res.json({ message: "Mining earnings transferred" });
  } catch (error) { await connection.rollback(); console.error("[mining.transfer]", error); res.status(500).json({ message: "Unable to transfer mining earnings" }); }
  finally { connection.release(); }
});

router.get("/admin/levels", auth, adminOnly, async (_req,res) => { try { const [levels]=await db.query("SELECT * FROM mining_levels ORDER BY sort_order,id"); res.json({levels}); } catch(e) { console.error("[mining.admin.levels]",e); res.status(500).json({message:"Unable to load mining levels"}); } });
router.post("/admin/levels", auth, adminOnly, async (req,res) => {
  const {name,description,power_watts,price,hourly_earning,battery_hours,battery_price,is_active,sort_order}=req.body;
  if(!String(name||"").trim()||String(name).trim().length>100||!Number.isSafeInteger(Number(power_watts))||Number(power_watts)<1||![price,hourly_earning,battery_price].every(v=>Number.isFinite(Number(v))&&Number(v)>=0)||!Number.isSafeInteger(Number(battery_hours))||Number(battery_hours)<1||String(description||"").length>500) return res.status(400).json({message:"Enter a name, positive wattage and runtime, and valid non-negative costs and hourly earnings"});
  try { const [result]=await db.query("INSERT INTO mining_levels (name,description,power_watts,price,hourly_earning,battery_hours,battery_price,is_active,sort_order) VALUES (?,?,?,?,?,?,?,?,?)",[String(name).trim(),String(description||"").trim()||null,Number(power_watts),Number(price),Number(hourly_earning),Number(battery_hours),Number(battery_price),is_active===undefined?1:(is_active?1:0),Math.max(1,Number(sort_order)||1)]); res.status(201).json({message:"Mining level created",level_id:result.insertId}); }
  catch(e){ if(e.code==="ER_DUP_ENTRY")return res.status(409).json({message:"A mining level with that name already exists"}); console.error("[mining.admin.create]",e);res.status(500).json({message:"Unable to create mining level"}); }
});
router.put("/admin/levels/:id", auth, adminOnly, async (req,res) => {
  const id=Number(req.params.id), {name,description,power_watts,price,hourly_earning,battery_hours,battery_price,is_active,sort_order}=req.body;
  if(!Number.isInteger(id)||id<1||!String(name||"").trim()||!Number.isSafeInteger(Number(power_watts))||Number(power_watts)<1||![price,hourly_earning,battery_price].every(v=>Number.isFinite(Number(v))&&Number(v)>=0)||!Number.isSafeInteger(Number(battery_hours))||Number(battery_hours)<1) return res.status(400).json({message:"Enter a name, positive wattage and runtime, and non-negative costs and hourly earnings"});
  try { const [result]=await db.query("UPDATE mining_levels SET name=?,description=?,power_watts=?,price=?,hourly_earning=?,battery_hours=?,battery_price=?,is_active=?,sort_order=? WHERE id=?",[String(name).trim(),String(description||"").trim()||null,Number(power_watts),Number(price),Number(hourly_earning),Number(battery_hours),Number(battery_price),is_active?1:0,Math.max(1,Number(sort_order)||1),id]); if(!result.affectedRows)return res.status(404).json({message:"Mining level not found"}); res.json({message:"Mining level updated"}); }
  catch(e){console.error("[mining.admin.update]",e);res.status(500).json({message:"Unable to update mining level"});}
});
router.delete("/admin/levels/:id", auth, adminOnly, async (req,res) => {
  const id=Number(req.params.id);
  if(!Number.isInteger(id)||id<1)return res.status(400).json({message:"Invalid mining level"});
  try {
    const [[level]]=await db.query("SELECT id,name FROM mining_levels WHERE id=?",[id]);
    if(!level)return res.status(404).json({message:"Mining level not found"});
    const [[usage]]=await db.query("SELECT COUNT(*) AS total FROM user_miners WHERE level_id=?",[id]);
    if(Number(usage.total))return res.status(409).json({message:"This level is used by existing miners. Deactivate it instead of deleting it."});
    await db.query("DELETE FROM mining_levels WHERE id=?",[id]);
    res.json({message:"Mining level deleted"});
  } catch(e){console.error("[mining.admin.delete]",e);res.status(500).json({message:"Unable to delete mining level"});}
});
module.exports=router;
