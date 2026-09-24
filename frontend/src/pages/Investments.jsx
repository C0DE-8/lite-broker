import { useState } from "react";
import { FiLayers, FiArrowUpRight } from "react-icons/fi";
import { money } from "../utils/format";
import { useApi } from "../hooks/useApi";
import { Heading, Status, Empty, Field, Button } from "../components/UI";
import Dialog from "../components/Dialog";
import ActionForm from "../components/ActionForm";
import s from "./Investments.module.css";
export default function Investments() {
  const plans = useApi("/plans"),
    history = useApi("/investments"),
    balances = useApi("/balances");
  const [selected, setSelected] = useState(null),
    [success, setSuccess] = useState("");
  const currencySymbol = balances.data?.balances.currency_symbol || "$";
  const available = balances.data
    ? Math.max(
        0,
        Number(balances.data.balances.main_balance) -
          Number(balances.data.balances.withdraw_hold || 0),
      )
    : 0;
  return (
    <>
      <Heading
        eyebrow="GIVE YOUR AMBITIONS DIRECTION"
        title="Your investments."
      >
        Choose a plan, review the details, and invest from your available
        balance.
      </Heading>
      {success && (
        <p className={s.success} role="status">
          {success}
        </p>
      )}
      <Status {...plans} retry={plans.reload} />
      {plans.data &&
        (plans.data.plans?.length ? (
          <div className={s.plans}>
            {plans.data.plans.map((plan) => (
              <article key={plan.id}>
                <FiLayers />
                <span>INVESTMENT PLAN</span>
                <h2>{plan.name}</h2>
                <p>Minimum investment</p>
                <h3>{money(plan.price, currencySymbol)}</h3>
                <dl>
                  <div>
                    <dt>Duration</dt>
                    <dd>{plan.duration_days} days</dd>
                  </div>
                  <div>
                    <dt>Plan’s stated ROI</dt>
                    <dd>{plan.roi_percent}%</dd>
                  </div>
                </dl>
                <p className={s.note}>
                  Stated returns are not guaranteed. Capital is at risk.
                </p>
                <Button
                  type="button"
                  secondary
                  onClick={() => {
                    setSuccess("");
                    setSelected(plan);
                  }}
                >
                  Review plan <FiArrowUpRight />
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty>No investment plans are available right now.</Empty>
        ))}
      {selected && (
        <Dialog
          title={`Invest in ${selected.name}`}
          onClose={() => setSelected(null)}
        >
          <div className={s.planSummary}>
            <div>
              <span>Minimum</span>
              <strong>{money(selected.price, currencySymbol)}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{selected.duration_days} days</strong>
            </div>
            <div>
              <span>Available balance</span>
              <strong>{balances.data ? money(available, currencySymbol) : "—"}</strong>
            </div>
          </div>
          <Status
            loading={balances.loading}
            error={balances.error}
            retry={balances.reload}
          />
          {balances.data &&
            (available < Number(selected.price) ? (
              <div className={s.funding}>
                <p>
                  This plan starts at {money(selected.price, currencySymbol)}. Add funds to your
                  wallet to invest.
                </p>
                <Button to="/app/wallet" onClick={() => setSelected(null)}>
                  Go to wallet
                </Button>
              </div>
            ) : (
              <ActionForm
                key={selected.id}
                endpoint="/investments"
                label="Review investment"
                review
                reviewText={`You are investing in ${selected.name} for ${selected.duration_days} days. Your available balance will be debited. Returns are not guaranteed.`}
                onSuccess={() => {
                  history.reload();
                  balances.reload();
                  setSuccess(
                    `Your investment in ${selected.name} was created successfully.`,
                  );
                  setSelected(null);
                }}
              >
                <input type="hidden" name="plan_id" value={selected.id} />
                <Field
                  label="Investment amount (USD)"
                  name="amount"
                  type="number"
                  min={Math.max(Number(selected.price), 0.01)}
                  max={available}
                  step="0.01"
                  defaultValue={selected.price}
                  required
                />
                <label className={s.consent}>
                  <input
                    name="risk_acknowledged"
                    type="checkbox"
                    value="yes"
                    required
                  />
                  I understand this investment can lose value and returns are
                  not guaranteed.
                </label>
                <label className={s.consent}>
                  <input
                    name="terms_acknowledged"
                    type="checkbox"
                    value="yes"
                    required
                  />
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noreferrer">
                    Terms &amp; Investment Policy
                  </a>
                  .
                </label>
              </ActionForm>
            ))}
        </Dialog>
      )}
      <section className={s.panel}>
        <h3>Investment history</h3>
        <Status {...history} retry={history.reload} variant="table" skeletonCount={1} />
        {history.data &&
          (history.data.investments?.length ? (
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>End date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.investments.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.plan_name || item.name || `Plan #${item.plan_id}`}
                      </td>
                      <td>{money(item.amount, currencySymbol)}</td>
                      <td>
                        <span className={s.badge}>{item.status}</span>
                      </td>
                      <td>
                        {item.ends_at
                          ? new Date(item.ends_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Your investment history will appear here.</Empty>
          ))}
      </section>
    </>
  );
}
