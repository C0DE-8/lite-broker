import { adminApi } from "../api/admin";
import { useApi } from "../hooks/useApi";
import { assets, cashBalances } from "../constants/assets";
import AssetBalances from "./AssetBalances";
import ActionForm from "./ActionForm";
import { Field, Status } from "./UI";
import { money } from "../utils/format";
import s from "./BalanceManager.module.css";
export default function BalanceManager({ userId, onUpdate }) {
  const account = useApi(`/users/${userId}`, adminApi),
    history = useApi(`/users/${userId}/balance-adjustments`, adminApi);
  const user = account.data?.user;
  return (
    <section className={s.panel}>
      <h3>Account balances</h3>
      <Status {...account} retry={account.reload} variant="panel" skeletonCount={1} />
      {user && (
        <>
          <div className={s.cash}>
            {cashBalances.map((key) => (
              <div key={key}>
                <span>{key.replaceAll("_", " ")} · {user.currency_symbol || "$"}</span>
                <strong>{money(user[key], user.currency_symbol)}</strong>
              </div>
            ))}
          </div>
          <AssetBalances balances={user.crypto_balances} />
          <p>
            Crypto amounts are in coin units and are separate from USD balances.
            Adjustments update the platform ledger; they do not transfer funds
            on a blockchain.
          </p>
          <ActionForm
            client={adminApi}
            endpoint={`/users/${userId}/balance-adjustments`}
            label="Review balance adjustment"
            review
            reviewText="Positive amounts credit this balance. Negative amounts debit it. Check the asset, units, and reason before confirming."
            onSuccess={() => {
              account.reload();
              history.reload();
              onUpdate();
            }}
          >
            <Field label="Balance to adjust" name="balance_key" as="select" assetIcons>
              {cashBalances.map((key) => (
                <option key={key} value={key}>
                  {key.replaceAll("_", " ")} ({user.currency_symbol || "$"})
                </option>
              ))}
              {assets.map((asset) => (
                <option key={asset}>{asset}</option>
              ))}
            </Field>
            <Field
              label="Adjustment amount (+ credit / − debit)"
              name="amount"
              type="number"
              step="any"
              required
              placeholder="e.g. 250 or -25"
            />
            <Field
              label="Reason for adjustment"
              name="reason"
              minLength={3}
              maxLength={250}
              required
              placeholder="Explain this correction or credit"
            />
          </ActionForm>
        </>
      )}
      <h3>Recent balance adjustments</h3>
      <Status {...history} retry={history.reload} variant="table" skeletonCount={1} />
      {history.data?.adjustments.length === 0 && (
        <p>No manual adjustments yet.</p>
      )}
      <div className={s.history}>
        {history.data?.adjustments.map((row) => (
          <article key={row.id}>
            <strong>
              {row.balance_key.replaceAll("_", " ")} · {row.amount}
            </strong>
            <span>
              {row.before_balance} → {row.after_balance}
            </span>
            <p>{row.reason}</p>
            <small>
              {row.admin_email} · {new Date(row.created_at).toLocaleString()}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
