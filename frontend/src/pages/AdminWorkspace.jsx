import BalanceManager from "../components/BalanceManager";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiCreditCard,
  FiShield,
  FiActivity,
  FiArrowUpRight,
} from "react-icons/fi";
import { adminApi } from "../api/admin";
import { adminSession } from "../api/admin";
import { useApi } from "../hooks/useApi";
import { Heading, Status, Empty, Button, Field } from "../components/UI";
import { money } from "../utils/format";
import { assets } from "../constants/assets";
import ActionForm from "../components/ActionForm";
import Dialog from "../components/Dialog";
import AssetIcon from "../components/AssetIcon";
import s from "./AdminWorkspace.module.css";
export default function AdminWorkspace({ section }) {
  return section === "users" ? (
    <Investors />
  ) : section === "plans" ? (
    <InvestmentPlans />
  ) : section === "investments" ? (
    <InvestmentHistory />
  ) : section === "mining" ? (
    <MiningAdmin />
  ) : section === "profile" ? (
    <AdminProfile />
  ) : section === "wallet-addresses" ? (
    <WalletAddresses />
  ) : section === "approvals" ? (
    <Approvals />
  ) : section === "activity" ? (
    <Activity />
  ) : (
    <Overview />
  );
}
function AdminProfile() {
  const profile = useApi("/me", adminApi);
  const [identity, setIdentity] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentIdentity = profile.data?.admin
    ? { name: identity.name || profile.data.admin.name, email: identity.email || profile.data.admin.email }
    : identity;

  async function updateProfile(e, includePassword = false) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await adminApi.patch("/profile", {
        ...currentIdentity,
        ...(includePassword ? passwords : {}),
      });
      adminSession.set(result.token);
      setIdentity(result.admin);
      setMessage(result.message);
      if (includePassword) setPasswords({ current_password: "", new_password: "" });
      profile.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading eyebrow="ADMINISTRATION" title="Your profile.">
        Keep the details you use to access and manage the workspace up to date.
      </Heading>
      <Status {...profile} retry={profile.reload} variant="panel" skeletonCount={1} />
      {profile.data && (
        <div className={s.profileLayout}>
          <section className={s.panel}>
            <div className={s.panelIntro}>
              <span className={s.profileBadge}><FiShield /></span>
              <div><h3>Personal details</h3><p>These details identify you in the workspace.</p></div>
            </div>
            <form className={s.profileForm} onSubmit={updateProfile}>
              <Field label="Name" name="name" value={currentIdentity.name} onChange={(e) => setIdentity({ ...currentIdentity, name: e.target.value })} required />
              <Field label="Email address" name="email" type="email" value={currentIdentity.email} onChange={(e) => setIdentity({ ...currentIdentity, email: e.target.value })} required />
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
            </form>
          </section>
          <section className={s.panel}>
            <div className={s.panelIntro}>
              <span className={s.profileBadge}><FiShield /></span>
              <div><h3>Sign-in security</h3><p>Change your password without leaving the workspace.</p></div>
            </div>
            <form className={s.profileForm} onSubmit={(e) => updateProfile(e, true)}>
              <Field label="Current password" name="current_password" type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required />
              <Field label="New password" name="new_password" type="password" minLength="8" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} required />
              <Button type="submit" secondary disabled={busy}>Update password</Button>
            </form>
          </section>
        </div>
      )}
      {error && <p className={s.formError} role="alert">{error}</p>}
      {message && <p className={s.formSuccess} role="status">{message}</p>}
    </>
  );
}
function WalletAddresses() {
  const wallets = useApi("/wallet-addresses", adminApi);
  const pinSettings = useApi("/withdrawal-pin-settings", adminApi);
  const [editing, setEditing] = useState(null);
  const [qrWallet, setQrWallet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = editing
        ? await adminApi.put(`/wallet-addresses/${editing.id}`, body)
        : await adminApi.post("/wallet-addresses", body);
      setMessage(result.message);
      setEditing(null);
      form.reset();
      wallets.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(wallet) {
    if (!window.confirm(`Remove the ${wallet.asset} wallet address?`)) return;
    setBusy(true);
    setError("");
    try {
      const result = await adminApi.delete(`/wallet-addresses/${wallet.id}`);
      setMessage(result.message);
      if (editing?.id === wallet.id) setEditing(null);
      wallets.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function savePinSettings(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setPinError("");
    setPinMessage("");
    try {
      const result = await adminApi.patch("/withdrawal-pin-settings", Object.fromEntries(new FormData(form)));
      setPinMessage(result.message);
      pinSettings.reload();
    } catch (err) {
      setPinError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading eyebrow="PAYMENT SETTINGS" title="Payment settings.">
        Manage deposit destinations and the withdrawal PIN information shown to investors.
      </Heading>
      <div className={s.walletLayout}>
        <section className={s.panel}>
          <h3>Withdrawal PIN information</h3>
          <p className={s.settingsHint}>This fee and message appear when an investor clicks the help icon beside Withdrawal PIN.</p>
          <Status {...pinSettings} retry={pinSettings.reload} variant="panel" skeletonCount={1} />
          {pinSettings.data && (
            <form className={s.walletForm} onSubmit={savePinSettings}>
              <Field label="PIN fee (USD)" name="fee" type="number" min="0" step="0.01" defaultValue={pinSettings.data.settings.fee} required />
              <Field label="Message for investors (optional)" name="message" as="textarea" rows="4" maxLength="500" defaultValue={pinSettings.data.settings.message} />
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save PIN information"}</Button>
            </form>
          )}
          {pinError && <p className={s.formError} role="alert">{pinError}</p>}
          {pinMessage && <p className={s.formSuccess} role="status">{pinMessage}</p>}
        </section>
        <section className={s.panel}>
          <h3>{editing ? `Edit ${editing.asset} address` : "Add wallet address"}</h3>
          <form className={s.walletForm} onSubmit={submit}>
            <Field label="Asset" name="asset" as="select" assetIcons defaultValue={editing?.asset || "BTC"} required>
              {assets.map((asset) => <option key={asset}>{asset}</option>)}
            </Field>
            <Field
              label="Wallet address"
              name="address"
              defaultValue={editing?.address || ""}
              placeholder="Paste the deposit address"
              required
            />
            <Field label={editing?.qr_path ? "Replace QR code (optional)" : "QR code (optional)"} name="qr" type="file" accept="image/png,image/jpeg,image/webp" />
            <div className={s.walletActions}>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : editing ? "Update address" : "Save address"}
              </Button>
              {editing && <Button type="button" secondary onClick={() => setEditing(null)}>Cancel</Button>}
            </div>
          </form>
          {error && <p className={s.formError} role="alert">{error}</p>}
          {message && <p className={s.formSuccess} role="status">{message}</p>}
        </section>
        <section className={s.panel}>
          <h3>Published deposit addresses</h3>
          <Status {...wallets} retry={wallets.reload} skeletonCount={2} />
          {wallets.data && (wallets.data.wallets.length ? (
            <div className={s.walletList}>
              {wallets.data.wallets.map((wallet) => (
                <article className={s.walletItem} key={wallet.id}>
                  <div className={s.walletAsset}><strong><AssetIcon asset={wallet.asset} size={25} />{wallet.asset}</strong><span>{wallet.qr_path ? "QR code uploaded" : "Address only"}</span></div>
                  <code>{wallet.address}</code>
                  <div className={s.walletActions}>
                    {wallet.qr_url && <button type="button" onClick={() => setQrWallet(wallet)}>View QR</button>}
                    <button type="button" onClick={() => setEditing(wallet)}>Edit</button>
                    <button type="button" className={s.danger} disabled={busy} onClick={() => remove(wallet)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
          ) : <Empty>No deposit addresses have been added yet.</Empty>)}
        </section>
      </div>
      {qrWallet && (
        <Dialog title={`${qrWallet.asset} deposit QR code`} onClose={() => setQrWallet(null)}>
          <div className={s.qrPreview}>
            <img src={qrWallet.qr_url} alt={`${qrWallet.asset} wallet address QR code`} />
            <code>{qrWallet.address}</code>
          </div>
        </Dialog>
      )}
    </>
  );
}
function Overview() {
  const profile = useApi("/me", adminApi),
    summary = useApi("/overview", adminApi);
  const values = summary.data?.overview;
  return (
    <>
      <Heading eyebrow="ADMINISTRATION" title="Your control room.">
        A clear view of investors, pending requests, and platform activity.
      </Heading>
      <Status {...profile} retry={profile.reload} variant="panel" skeletonCount={1} />
      {profile.data && (
        <div className={s.profile}>
          <FiShield />
          <div>
            <strong>{profile.data.admin.name}</strong>
            <span>{profile.data.admin.email}</span>
          </div>
          <span>Administrator</span>
        </div>
      )}
      <Status {...summary} retry={summary.reload} />
      {values && (
        <div className={s.stats}>
          {[
            [FiUsers, "Investors", values.users, "/admin/users"],
            [
              FiCreditCard,
              "Pending deposits",
              values.pending_deposits,
              "/admin/approvals",
            ],
            [
              FiCreditCard,
              "Pending withdrawals",
              values.pending_withdrawals,
              "/admin/approvals",
            ],
            [FiShield, "KYC reviews", values.pending_kyc, "/admin/approvals"],
          ].map(([Icon, label, value, to]) => (
            <Link to={to} key={label}>
              <Icon />
              <span>{label}</span>
              <strong>{value}</strong>
              <FiArrowUpRight />
            </Link>
          ))}
        </div>
      )}
      <div className={s.panel}>
        <h3>Platform overview</h3>
        <div className={s.metrics}>
          <div>
            <span>Active investments</span>
            <strong>{values ? money(values.invested) : "—"}</strong>
          </div>
          <div>
            <span>Open trades</span>
            <strong>{values?.open_trades ?? "—"}</strong>
          </div>
        </div>
        <p className={s.note}>
          Administrative changes and sign-in attempts are recorded in activity
          logs. Passwords, PINs, and tokens are never included.
        </p>
        <Button to="/admin/activity" secondary>
          View activity logs <FiActivity />
        </Button>
      </div>
    </>
  );
}
function Investors() {
  const users = useApi("/users", adminApi),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  const rows = (users.data?.users || []).filter((u) =>
    `${u.full_name} ${u.email} ${u.username}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading eyebrow="INVESTOR ACCOUNTS" title="Investors.">
        Review account balances and manage trading indicators.
      </Heading>
      <div className={s.search}>
        <Field
          label="Search investors"
          placeholder="Name, email, or username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Status {...users} retry={users.reload} variant="table" skeletonCount={1} />
      {users.data && (
        <div className={s.panel}>
          {rows.length ? (
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Investor</th>
                    <th>Available</th>
                    <th>Invested</th>
                    <th>Strength</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.full_name}</strong>
                        <small>{u.email}</small>
                      </td>
                      <td>{money(u.main_balance, u.currency_symbol)}</td>
                      <td>{money(u.investment_balance, u.currency_symbol)}</td>
                      <td>{Number(u.signal_strength)} / 100</td>
                      <td>{u.account_status}</td>
                      <td>
                        <Button secondary onClick={() => setSelected(u)}>
                          Manage account
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No investors match your search.</Empty>
          )}
        </div>
      )}
      {selected && (
        <Dialog title={selected.full_name} onClose={() => setSelected(null)}>
          <BalanceManager userId={selected.id} onUpdate={users.reload} />
          <h3>Trading settings</h3>
          <p className={s.note}>
            {selected.email} · Indicators are account settings, not predictions
            of market returns.
          </p>
          <ActionForm
            client={adminApi}
            endpoint={`/users/${selected.id}/trading-settings`}
            method="patch"
            label="Review trading settings"
            review
            reviewText="These settings are visible in the investor’s dashboard and trading workspace."
            onSuccess={() => {
              users.reload();
              setSelected(null);
            }}
          >
            <Field
              label="Account currency sign"
              name="currency_symbol"
              maxLength="8"
              defaultValue={selected.currency_symbol || "$"}
              placeholder="$, £, €, ¥, or another sign"
              required
            />
            <Field
              label="Signal strength (0–100)"
              name="signal_strength"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={selected.signal_strength}
              required
            />
            <Field
              label="Trade progress (0–100)"
              name="trade_progress"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={selected.trade_progress}
              required
            />
            <Field
              label="Trading status"
              name="trading_status"
              as="select"
              defaultValue={selected.trading_status}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="locked">Locked</option>
            </Field>
          </ActionForm>
        </Dialog>
      )}
    </>
  );
}

function InvestmentPlans() {
  const plans = useApi("/plans?active_only=0", adminApi);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.is_active = data.is_active === "1";
    try {
      const result = editing ? await adminApi.put(`/plans/${editing.id}`, data) : await adminApi.post("/plans", data);
      setMessage(result.message); setEditing(null); form.reset(); plans.reload();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <>
    <Heading eyebrow="INVESTMENT MANAGEMENT" title="Investment plans.">Create plans for investors and update their terms or availability.</Heading>
    <div className={s.walletLayout}>
      <section className={s.panel}>
        <h3>{editing ? `Edit ${editing.name}` : "Create a plan"}</h3>
        <form className={s.walletForm} key={editing?.id || "new-plan"} onSubmit={save}>
          <Field label="Plan name" name="name" defaultValue={editing?.name || ""} required maxLength="120" />
          <Field label="Description" name="description" as="textarea" rows="3" defaultValue={editing?.description || ""} maxLength="2000" />
          <Field label="Minimum investment (USD)" name="price" type="number" min="0.01" step="0.01" defaultValue={editing?.price || ""} required />
          <Field label="ROI (%)" name="roi_percent" type="number" min="0" step="0.01" defaultValue={editing?.roi_percent || ""} required />
          <Field label="Accuracy indicator (%)" name="accuracy_percent" type="number" min="0" max="100" step="0.01" defaultValue={editing?.accuracy_percent || "0"} required />
          <Field label="Duration (days)" name="duration_days" type="number" min="1" step="1" defaultValue={editing?.duration_days || ""} required />
          <Field label="Availability" name="is_active" as="select" defaultValue={editing ? String(editing.is_active ? 1 : 0) : "1"}><option value="1">Active</option><option value="0">Inactive</option></Field>
          <div className={s.walletActions}><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save plan" : "Create plan"}</Button>{editing && <Button type="button" secondary onClick={() => setEditing(null)}>Cancel</Button>}</div>
        </form>
        {error && <p className={s.formError} role="alert">{error}</p>}{message && <p className={s.formSuccess} role="status">{message}</p>}
      </section>
      <section className={s.panel}>
        <h3>All plans</h3><Status {...plans} retry={plans.reload} skeletonCount={2} />
        {plans.data && (plans.data.plans.length ? <div className={s.planList}>{plans.data.plans.map((plan) => <article className={s.planItem} key={plan.id}>
          <div className={s.walletAsset}><strong>{plan.name}</strong><span>{plan.is_active ? "Active" : "Inactive"}</span></div>
          <p>{plan.description || "No description"}</p><small>{money(plan.price)} minimum · {plan.roi_percent}% ROI · {plan.duration_days} days</small>
          <div className={s.walletActions}><button type="button" onClick={() => { setEditing(plan); setMessage(""); setError(""); }}>Edit</button></div>
        </article>)}</div> : <Empty>No plans are configured yet.</Empty>)}
      </section>
    </div>
  </>;
}

function InvestmentHistory() {
  const investments = useApi("/investments", adminApi), users = useApi("/users", adminApi), plans = useApi("/plans?active_only=1", adminApi);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  async function add(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try { const result = await adminApi.post("/investments", body); setMessage(result.message); form.reset(); investments.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <>
    <Heading eyebrow="INVESTMENT MANAGEMENT" title="Investment history.">Review investor records and add an investment entry to a user account.</Heading>
    <section className={`${s.panel} ${s.createInvestment}`}><h3>Add investment history</h3>
      <form className={s.investmentForm} onSubmit={add}>
        <Field label="Investor" name="user_id" as="select" searchable searchPlaceholder="Search name, email, or username…" defaultValue="" required><option value="" disabled>Select investor</option>{(users.data?.users || []).map((user) => <option key={user.id} value={user.id} data-search={user.username}>{user.full_name} · {user.email}</option>)}</Field>
        <Field label="Plan" name="plan_id" as="select" defaultValue="" required><option value="" disabled>Select plan</option>{(plans.data?.plans || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price)} minimum</option>)}</Field>
        <Field label="Amount (USD)" name="amount" type="number" min="0.01" step="0.01" required />
        <Field label="Admin note (optional)" name="admin_note" as="textarea" rows="2" maxLength="1000" />
        <Button type="submit" disabled={busy || !users.data || !plans.data}>{busy ? "Saving…" : "Add investment"}</Button>
      </form>
      <p className={s.settingsHint}>This creates an active history record and increases the investor’s investment balance by the same amount.</p>
      {error && <p className={s.formError} role="alert">{error}</p>}{message && <p className={s.formSuccess} role="status">{message}</p>}
    </section>
    <section className={`${s.panel} ${s.historyPanel}`}><h3>Investor investment records</h3><Status {...investments} retry={investments.reload} variant="table" skeletonCount={1} />
      {investments.data && (investments.data.investments.length ? <div className={s.table}><table><thead><tr><th>Investor</th><th>Plan</th><th>Amount</th><th>Expected total</th><th>Duration</th><th>Status</th><th>Started</th></tr></thead><tbody>{investments.data.investments.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong><small>{item.email}</small></td><td>{item.plan_name}</td><td>{money(item.amount)}</td><td>{money(item.expected_total)}</td><td>{item.duration_days} days</td><td>{item.status}</td><td>{item.started_at ? new Date(item.started_at).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div> : <Empty>No investment records yet.</Empty>)}
    </section>
  </>;
}

function MiningAdmin() {
  const levels = useApi("/mining/admin/levels", adminApi);
  const blankLevel = { name: "", description: "", power_watts: "100", price: "25", hourly_earning: "0.01", battery_hours: "12", battery_price: "2", sort_order: "4", is_active: "1" };
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e, id) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const result = await adminApi.put(`/mining/admin/levels/${id}`, Object.fromEntries(new FormData(e.currentTarget))); setMessage(result.message); levels.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function createLevel(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const result = await adminApi.post("/mining/admin/levels", Object.fromEntries(new FormData(e.currentTarget))); setMessage(result.message); e.currentTarget.reset(); levels.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function deleteLevel(level) {
    if (!window.confirm(`Delete the ${level.name} level?`)) return;
    setBusy(true); setError(""); setMessage("");
    try { const result = await adminApi.delete(`/mining/admin/levels/${level.id}`); setMessage(result.message); levels.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <>
    <Heading eyebrow="MINING SETTINGS" title="Mining levels.">Create and manage equipment levels, hourly mining credits, and battery runtime and cost.</Heading>
    <Status {...levels} retry={levels.reload} />
    {error && <p className={s.formError} role="alert">{error}</p>}{message && <p className={s.formSuccess} role="status">{message}</p>}
    <section className={s.panel}>
      <h3>Add a mining level</h3>
      <form className={s.miningCreateForm} onSubmit={createLevel}>
        <Field label="Level name" name="name" maxLength="100" placeholder="e.g. Ultra Miner" required />
        <Field label="Description" name="description" maxLength="500" placeholder="Short description" />
        <Field label="Equipment power (W)" name="power_watts" type="number" min="1" step="1" defaultValue={blankLevel.power_watts} required />
        <Field label="Equipment price (USD)" name="price" type="number" min="0" step="0.01" defaultValue={blankLevel.price} required />
        <Field label="Mining credit per hour (USD)" name="hourly_earning" type="number" min="0" step="0.0001" defaultValue={blankLevel.hourly_earning} required />
        <Field label="Battery runtime (hours)" name="battery_hours" type="number" min="1" step="1" defaultValue={blankLevel.battery_hours} required />
        <Field label="Battery price (USD)" name="battery_price" type="number" min="0" step="0.01" defaultValue={blankLevel.battery_price} required />
        <Field label="Display order" name="sort_order" type="number" min="1" step="1" defaultValue={blankLevel.sort_order} required />
        <Field label="Availability" name="is_active" as="select" defaultValue="1"><option value="1">Active</option><option value="0">Inactive</option></Field>
        <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add level"}</Button>
      </form>
    </section>
    <div className={s.miningAdminGrid}>{(levels.data?.levels || []).map((level) => <section className={s.panel} key={level.id}><div className={s.miningLevelHeading}><h3>{level.name}</h3><button type="button" disabled={busy} onClick={() => deleteLevel(level)}>Delete</button></div>
      <form className={s.walletForm} onSubmit={(e) => save(e, level.id)}>
        <Field label="Level name" name="name" defaultValue={level.name} required />
        <Field label="Description" name="description" defaultValue={level.description || ""} maxLength="500" />
        <Field label="Equipment power (W)" name="power_watts" type="number" min="1" step="1" defaultValue={level.power_watts} required />
        <Field label="Equipment price (USD)" name="price" type="number" min="0" step="0.01" defaultValue={level.price} required />
        <Field label="Mining credit per hour (USD)" name="hourly_earning" type="number" min="0" step="0.0001" defaultValue={level.hourly_earning} required />
        <Field label="Battery runtime (hours)" name="battery_hours" type="number" min="1" step="1" defaultValue={level.battery_hours} required />
        <Field label="Battery price (USD)" name="battery_price" type="number" min="0" step="0.01" defaultValue={level.battery_price} required />
        <Field label="Display order" name="sort_order" type="number" min="1" step="1" defaultValue={level.sort_order} required />
        <Field label="Availability" name="is_active" as="select" defaultValue={String(level.is_active ? 1 : 0)}><option value="1">Active</option><option value="0">Inactive</option></Field>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save level"}</Button>
      </form>
    </section>)}</div>
    {levels.data && levels.data.levels.length === 0 && <Empty>No mining levels exist in the database.</Empty>}
  </>;
}

function Approvals() {
  const [type, setType] = useState("deposits");
  return (
    <>
      <Heading eyebrow="REVIEW QUEUE" title="Requests awaiting review.">
        Check submitted details before approving or declining a request.
      </Heading>
      <div className={s.tabs}>
        {[
          ["users", "Users"],
          ["deposits", "Deposits"],
          ["withdrawals", "Withdrawals"],
          ["kyc", "Identity verification"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={type === value ? s.active : ""}
            onClick={() => setType(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <Queue key={type} type={type} />
    </>
  );
}
function Queue({ type }) {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState("pending"),
    [selected, setSelected] = useState(null);
  const result = useApi(
    `/${type}?status=${status}&page=${page}&limit=20`,
    adminApi,
  );
  const rows = result.data?.[type === "kyc" ? "kyc_list" : type] || [];
  return (
    <>
      <Status {...result} retry={result.reload} />
      {result.data && (
        <section className={s.panel}>
          <div className={s.queueControls}>
            <Field
              label="Request status"
              name="status"
              as="select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
                setSelected(null);
              }}
            >
              <option value="pending">Pending review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="all">All requests</option>
            </Field>
          </div>
          {rows.length ? (
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Investor</th>
                    <th>{type === "kyc" ? "Submitted" : type === "users" ? "Registered" : "Amount"}</th>
                    <th>Details</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>{r.email || r.full_name || `User #${r.user_id}`}</td>
                      <td>
                        {type === "kyc"
                          ? new Date(r.created_at).toLocaleDateString()
                          : type === "users"
                            ? new Date(r.created_at).toLocaleDateString()
                          : money(r.amount)}
                      </td>
                      <td>{r.asset || r.method || (type === "users" ? r.account_status : "Identity documents")}</td>
                      <td>
                        <Button secondary onClick={() => setSelected(r)}>
                          Review request
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No pending requests.</Empty>
          )}
          {result.data.meta && (
            <Pagination
              page={page}
              pages={result.data.meta.total_pages}
              onChange={setPage}
            />
          )}
        </section>
      )}
      {selected && (
        <Dialog
          title={`Review ${type === "kyc" ? "identity" : type.slice(0, -1)} #${selected.id}`}
          onClose={() => setSelected(null)}
        >
          <RequestDetails type={type} item={selected} />
          <ActionForm
            client={adminApi}
            endpoint={`/${type}/${selected.id}/approve`}
            label="Approve request"
            review
            reviewText={
              type === "users"
                ? "Approval allows this user to sign in to the investor workspace."
                : type === "deposits"
                ? "Approval credits this deposit to the investor’s account."
                : type === "withdrawals"
                  ? "Only approve after completing the payout through your payment process."
                  : "Confirm the identity documents were checked."
            }
            onSuccess={() => {
              result.reload();
              setSelected(null);
            }}
          >
            <Field
              label="Review note (optional)"
              name="admin_note"
              as="textarea"
            />
          </ActionForm>
          <div className={s.decline}>
            <ActionForm
              client={adminApi}
              endpoint={`/${type}/${selected.id}/decline`}
              label="Decline request"
              review
              reviewText="This rejects the request and records your reason."
              onSuccess={() => {
                result.reload();
                setSelected(null);
              }}
            >
              <Field label="Reason for declining" name="admin_note" required />
            </ActionForm>
          </div>
        </Dialog>
      )}
    </>
  );
}
function RequestDetails({ type, item }) {
  const uploadBase = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/users\/?$/,
    "",
  );
  return (
    <div className={s.details}>
      {Object.entries(item)
        .filter(
          ([k, v]) =>
            v != null &&
            [
              "email",
              "full_name",
              "amount",
              "asset",
              "method",
              "crypto_address",
              "crypto_network",
              "bank_name",
              "bank_account_number",
              "bank_account_name",
              "bank_country",
            ].includes(k),
        )
        .map(([k, v]) => (
          <div key={k}>
            <span>{k.replaceAll("_", " ")}</span>
            <strong>{String(v)}</strong>
          </div>
        ))}
      {type === "deposits" && item.proof_path && (
        <a
          href={`${uploadBase}${item.proof_path}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open payment proof <FiArrowUpRight />
        </a>
      )}
      {type === "kyc" &&
        ["selfie_filename", "id_front_filename", "id_back_filename"].map(
          (k) =>
            item[k] && (
              <a
                key={k}
                href={`${uploadBase}/uploads/kyc/${encodeURIComponent(item[k])}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open {k.replace("_filename", "").replaceAll("_", " ")}{" "}
                <FiArrowUpRight />
              </a>
            ),
        )}
    </div>
  );
}
function Activity() {
  const [page, setPage] = useState(1);
  const result = useApi(`/audit-logs?page=${page}`, adminApi);
  return (
    <>
      <Heading
        eyebrow="ACCOUNTABILITY"
        title="Admin activity."
        action={
          <Button secondary onClick={result.reload}>
            Refresh logs
          </Button>
        }
      >
        Sign-ins and administrative changes, recorded from this update onward.
      </Heading>
      <Status {...result} retry={result.reload} />
      {result.data && (
        <section className={s.panel}>
          {result.data.logs.length ? (
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.admin_email || "Unauthenticated sign-in"}</td>
                      <td>{log.method}</td>
                      <td>{log.resource}</td>
                      <td>
                        <span
                          className={log.status_code < 400 ? s.ok : s.failure}
                        >
                          {log.status_code < 400 ? "Success" : "Rejected"} ·{" "}
                          {log.status_code}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Administrative activity will appear here.</Empty>
          )}
          <Pagination
            page={page}
            pages={Math.ceil(result.data.total / result.data.limit)}
            onChange={setPage}
          />
        </section>
      )}
    </>
  );
}
function Pagination({ page, pages, onChange }) {
  return (
    <div className={s.pagination}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {Math.max(1, pages || 1)}
      </span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
