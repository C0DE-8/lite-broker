const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  ensurePlatformSettings,
  getWithdrawalPinSettings,
} = require("../utils/platformSettings");
router.get("/me", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id,name,email,created_at FROM admins WHERE id=?",
      [req.user.id],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });
    res.json({ admin: rows[0] });
  } catch {
    res.status(500).json({ message: "Unable to load admin profile" });
  }
});
router.get("/overview", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM deposits WHERE status='pending') AS pending_deposits, (SELECT COUNT(*) FROM withdrawals WHERE status='pending') AS pending_withdrawals, (SELECT COUNT(*) FROM user_kyc WHERE status='pending') AS pending_kyc, (SELECT COALESCE(SUM(amount),0) FROM user_investments WHERE status='active') AS invested, ((SELECT COUNT(*) FROM trades WHERE status='open') + (SELECT COUNT(*) FROM binary_trades WHERE status='open')) AS open_trades`,
    );
    res.json({ overview: rows[0] });
  } catch {
    res.status(500).json({ message: "Unable to load admin overview" });
  }
});
router.get("/withdrawal-pin-settings", auth, adminOnly, async (req, res) => {
  try {
    res.json({ settings: await getWithdrawalPinSettings(db) });
  } catch (error) {
    console.error("[admin.withdrawal-pin-settings.get] failed:", error);
    res.status(500).json({ message: "Unable to load withdrawal PIN settings" });
  }
});
router.patch("/withdrawal-pin-settings", auth, adminOnly, async (req, res) => {
  const fee = String(req.body.fee ?? "").trim();
  const message = String(req.body.message ?? "").trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(fee) || message.length > 500) {
    return res.status(400).json({
      message: "Enter a valid non-negative fee and a message of up to 500 characters.",
    });
  }
  const conn = await db.getConnection();
  try {
    await ensurePlatformSettings(conn);
    await conn.beginTransaction();
    await conn.query(
      "INSERT INTO platform_settings (setting_key,setting_value,updated_by) VALUES ('withdrawal_pin_fee',?,?),('withdrawal_pin_message',?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_by=VALUES(updated_by)",
      [Number(fee).toFixed(2), req.user.id, message, req.user.id],
    );
    await conn.commit();
    res.json({ message: "Withdrawal PIN information updated" });
  } catch (error) {
    await conn.rollback();
    console.error("[admin.withdrawal-pin-settings.update] failed:", error);
    res.status(500).json({ message: "Unable to update withdrawal PIN settings" });
  } finally {
    conn.release();
  }
});
router.get("/audit-logs", auth, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1),
      limit = 30;
    const [logs] = await db.query(
      "SELECT id,admin_id,admin_email,method,resource,status_code,created_at FROM admin_audit_logs ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, (page - 1) * limit],
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM admin_audit_logs",
    );
    res.json({ logs, total, page, limit });
  } catch {
    res.status(500).json({ message: "Unable to load admin activity" });
  }
});
router.patch(
  "/users/:id/trading-settings",
  auth,
  adminOnly,
  async (req, res) => {
    const id = Number(req.params.id),
      signal = Number(req.body.signal_strength),
      progress = Number(req.body.trade_progress),
      status = req.body.trading_status,
      currencySymbol =
        req.body.currency_symbol === undefined
          ? null
          : String(req.body.currency_symbol).trim();
    if (
      !Number.isInteger(id) ||
      id < 1 ||
      !Number.isFinite(signal) ||
      signal < 0 ||
      signal > 100 ||
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100 ||
      !["active", "inactive", "locked"].includes(status) ||
      (currencySymbol !== null &&
        (!currencySymbol ||
          currencySymbol.length > 8 ||
          /[\x00-\x1F\x7F]/.test(currencySymbol)))
    )
      return res.status(400).json({
        message:
          "Strength and progress must be 0–100; select a valid trading status and currency sign.",
      });
    try {
      const [result] = await db.query(
        "UPDATE users SET signal_strength=?,trade_progress=?,trading_status=?,currency_symbol=COALESCE(?,currency_symbol) WHERE id=?",
        [signal, progress, status, currencySymbol, id],
      );
      if (!result.affectedRows)
        return res.status(404).json({ message: "User not found" });
      res.json({ message: "Trading settings updated" });
    } catch (error) {
      console.error("[admin.trading-settings.update] failed:", error);
      res.status(500).json({ message: "Unable to update trading settings" });
    }
  },
);
const coins = [
  "BTC",
  "ETH",
  "USDT",
  "BNB",
  "LTC",
  "DOGE",
  "XRP",
  "SHIB",
  "SOL",
];
const cash = ["main_balance", "profit_balance", "investment_balance"];
router.get(
  "/users/:id/balance-adjustments",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const [adjustments] = await db.query(
        "SELECT b.*,a.email AS admin_email FROM balance_adjustments b LEFT JOIN admins a ON a.id=b.admin_id WHERE user_id=? ORDER BY b.id DESC LIMIT 50",
        [req.params.id],
      );
      res.json({ adjustments });
    } catch (error) {
      console.error("[admin.balance-adjustments.list] failed:", error);
      res.status(500).json({ message: "Unable to load balance history" });
    }
  },
);
router.post(
  "/users/:id/balance-adjustments",
  auth,
  adminOnly,
  async (req, res) => {
    const id = Number(req.params.id),
      key = req.body.balance_key,
      amount = String(req.body.amount ?? ""),
      reason = String(req.body.reason || "").trim();
    const isCash = cash.includes(key);
    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !(isCash || coins.includes(key)) ||
      !(isCash ? /^-?\d{1,10}(\.\d{1,2})?$/ : /^-?\d{1,10}(\.\d{1,8})?$/).test(
        amount,
      ) ||
      Number(amount) === 0 ||
      reason.length < 3 ||
      reason.length > 250
    )
      return res
        .status(400)
        .json({
          message:
            "Select a balance, enter a nonzero adjustment (cash: 2 decimals; crypto: 8), and a reason of 3–250 characters.",
        });
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [[user]] = await conn.query(
        "SELECT id,withdraw_hold FROM users WHERE id=? FOR UPDATE",
        [id],
      );
      if (!user) {
        await conn.rollback();
        return res.status(404).json({ message: "Investor not found" });
      }
      if (!isCash)
        await conn.query(
          "INSERT IGNORE INTO user_crypto_balances (user_id,asset,balance) VALUES (?,?,0)",
          [id, key],
        );
      const table = isCash ? "users" : "user_crypto_balances",
        column = isCash ? key : "balance",
        where = isCash ? "id=?" : "user_id=? AND asset=?",
        params = isCash ? [id] : [id, key];
      const [[before]] = await conn.query(
        `SELECT ${column} AS balance FROM ${table} WHERE ${where} FOR UPDATE`,
        params,
      );
      const floor = key === "main_balance" ? user.withdraw_hold || "0" : "0";
      const [result] = await conn.query(
        `UPDATE ${table} SET ${column}=${column}+CAST(? AS DECIMAL(28,8)) WHERE ${where} AND ${column}+CAST(? AS DECIMAL(28,8))>=?`,
        [amount, ...params, amount, floor],
      );
      if (!result.affectedRows) {
        await conn.rollback();
        return res
          .status(400)
          .json({
            message:
              "Adjustment would create a negative balance or use funds reserved for withdrawal.",
          });
      }
      const [[after]] = await conn.query(
        `SELECT ${column} AS balance FROM ${table} WHERE ${where}`,
        params,
      );
      await conn.query(
        "INSERT INTO balance_adjustments (user_id,admin_id,balance_key,amount,before_balance,after_balance,reason) VALUES (?,?,?,?,?,?,?)",
        [id, req.user.id, key, amount, before.balance, after.balance, reason],
      );
      await conn.commit();
      res.json({
        message: "Balance adjusted successfully",
        balance: after.balance,
      });
    } catch (error) {
      await conn.rollback();
      console.error("[admin.balance-adjustments.create] failed:", error);
      res
        .status(500)
        .json({ message: "Unable to adjust balance. No changes were saved." });
    } finally {
      conn.release();
    }
  },
);
module.exports = router;
