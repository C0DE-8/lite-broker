import { useState } from "react";
import { Heading, Status, Empty, Field, Button } from "../components/UI";
import { useApi } from "../hooks/useApi";
import { api } from "../api/client";
import { money } from "../utils/format";
import s from "./Mining.module.css";

export default function Mining() {
  const levels = useApi("/levels", api), account = useApi("/me", api);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const symbol = account.data?.balances?.currency_symbol || "$";
  async function act(path, body, method = "post") {
    setBusy(true); setError(""); setMessage("");
    try { const result = await api[method](path, body); setMessage(result.message); account.reload(); return result; }
    catch (err) { setError(err.message); throw err; } finally { setBusy(false); }
  }
  return <>
    <Heading eyebrow="MINING WORKSPACE" title="Your mining equipment.">Purchase equipment, manage battery runtime, and track hourly credits in your mining balance.</Heading>
    <Status {...levels} retry={levels.reload} /><Status {...account} retry={account.reload} />
    {error && <p className={s.error} role="alert">{error}</p>}{message && <p className={s.success} role="status">{message}</p>}
    {account.data && <div className={s.summary}><div><span>Mining balance</span><strong>{money(account.data.balances.mining_balance,symbol)}</strong></div><div><span>Available balance for purchases</span><strong>{money(Math.max(0,Number(account.data.balances.main_balance)-Number(account.data.balances.withdraw_hold||0)),symbol)}</strong></div><div><span>Equipment owned</span><strong>{account.data.miners.length}</strong></div></div>}
    <h2>Available equipment</h2>
    {levels.data && (levels.data.levels.length ? <div className={s.levels}>{levels.data.levels.map(level => <article className={s.card} key={level.id}><span>{level.power_watts.toLocaleString()} WATTS</span><h2>{level.name}</h2><p>{level.description || "Mining equipment"}</p><h3>{money(level.price,symbol)}</h3><dl><div><dt>Mining credit</dt><dd>{money(level.hourly_earning,symbol)} / hour</dd></div><div><dt>Battery runtime</dt><dd>{level.battery_hours} hours</dd></div><div><dt>Battery price</dt><dd>{money(level.battery_price,symbol)}</dd></div></dl><Button type="button" disabled={busy||!account.data} onClick={()=>act("/equipment",{level_id:level.id})}>Purchase equipment</Button></article>)}</div> : <Empty>Mining equipment is not available right now.</Empty>)}
    <h2>Your miners</h2>
    {account.data && (account.data.miners.length ? <div className={s.miners}>{account.data.miners.map(miner => <article className={s.card} key={miner.id}><div className={s.minerHead}><h3>{miner.level_name}</h3><span>{miner.status}</span></div><dl><div><dt>Power</dt><dd>{Number(miner.power_watts).toLocaleString()} W</dd></div><div><dt>Rate</dt><dd>{money(miner.hourly_earning,symbol)} / hour</dd></div><div><dt>Battery left</dt><dd>{Math.floor(miner.battery_seconds_remaining/3600)}h {Math.floor((miner.battery_seconds_remaining%3600)/60)}m</dd></div></dl><div className={s.actions}><Button type="button" secondary disabled={busy||miner.status==="running"||miner.battery_seconds_remaining>0} onClick={()=>act(`/miners/${miner.id}/battery`,{})}>Buy battery · {money(miner.battery_price,symbol)}</Button>{miner.status === "running" ? <Button type="button" disabled={busy} onClick={()=>act(`/miners/${miner.id}/state`,{action:"stop"},"patch")}>Stop miner</Button> : <Button type="button" disabled={busy||miner.battery_seconds_remaining===0} onClick={()=>act(`/miners/${miner.id}/state`,{action:"start"},"patch")}>Start miner</Button>}</div></article>)}</div> : <Empty>Purchased equipment will appear here.</Empty>)}
    <section className={s.panel}><h2>Transfer mining balance</h2><p>Move available mining credits to one of your account balances.</p><form className={s.transfer} onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const body=Object.fromEntries(new FormData(form));act("/transfer",body).then(()=>form.reset());}}><Field label="Account balance" name="balance_key" as="select" defaultValue="main_balance"><option value="main_balance">Available balance</option><option value="profit_balance">Profit balance</option><option value="investment_balance">Investment balance</option></Field><Field label="Amount (USD)" name="amount" type="number" min="0.01" step="0.01" max={account.data?.balances.mining_balance || 0} required/><Button type="submit" disabled={busy||!account.data?.balances.mining_balance}>Transfer</Button></form></section>
    <section className={s.panel}><h2>Mining activity</h2>{account.data && (account.data.history.length ? <div className={s.transactions}><table><thead><tr><th>Activity</th><th>Amount</th><th>Mining balance</th><th>Date</th></tr></thead><tbody>{account.data.history.map(row=><tr key={row.id}><td>{row.note || row.type.replaceAll("_"," ")}</td><td>{money(row.amount,symbol)}</td><td>{money(row.mining_balance_after,symbol)}</td><td><small>{new Date(row.created_at).toLocaleString()}</small></td></tr>)}</tbody></table></div> : <Empty>Mining activity will appear here.</Empty>)}</section>
  </>;
}
