import { useState } from "react";
import { FiUsers } from "react-icons/fi";
import { useApi } from "../hooks/useApi";
import { Heading, Status, Empty, Button } from "../components/UI";
import ActionForm from "../components/ActionForm";
import s from "./CopyTrading.module.css";
export default function CopyTrading() {
  const list = useApi("/copy-traders"),
    status = useApi("/copy-traders/status");
  const [selected, setSelected] = useState(null);
  function refresh() {
    status.reload();
    setSelected(null);
  }
  return (
    <>
      <Heading eyebrow="A DIFFERENT PERSPECTIVE" title="Explore copy trading.">
        Review available traders and manage your copy-trading selection.
      </Heading>
      <p className={s.note}>
        Trader statistics are supplied by the platform. Past performance does
        not guarantee future results. Copy trading involves risk.
      </p>
      <Status {...status} retry={status.reload} variant="panel" skeletonCount={1} />
      {status.data && (
        <section className={s.status}>
          <div>
            <span>CURRENT SELECTION</span>
            <h3>{status.data.trader?.trader_name || "No active trader"}</h3>
            <p>Status: {status.data.copy_trading_status || "Inactive"}</p>
          </div>
          {status.data.trader && (
            <ActionForm
              endpoint="/copy-traders/stop"
              label="Stop copying"
              review
              reviewText="Stop copying your currently selected trader."
              onSuccess={refresh}
            />
          )}
        </section>
      )}
      <Status {...list} retry={list.reload} />
      {list.data &&
        (list.data.traders.length ? (
          <div className={s.grid}>
            {list.data.traders.map((trader) => (
              <article key={trader.id}>
                <div className={s.avatar}>
                  <FiUsers />
                </div>
                <h2>{trader.trader_name}</h2>
                <dl>
                  <div>
                    <dt>Reported win rate</dt>
                    <dd>{trader.win_rate_percent}%</dd>
                  </div>
                  <div>
                    <dt>Reported profit</dt>
                    <dd>{trader.profit_percent}%</dd>
                  </div>
                </dl>
                <Button
                  secondary
                  onClick={() => setSelected(trader)}
                  disabled={
                    status.loading ||
                    !!status.error ||
                    status.data?.copied_trader_id === trader.id
                  }
                >
                  {status.data?.copied_trader_id === trader.id
                    ? "Selected"
                    : "Review trader"}
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty>No copy traders are available right now.</Empty>
        ))}
      {selected && (
        <section className={s.status}>
          <div>
            <h3>Copy {selected.trader_name}</h3>
            <p>This changes your account’s selected copy trader.</p>
            <ActionForm
              endpoint={`/copy-traders/${selected.id}/copy`}
              label="Review copy request"
              review
              reviewText={`Confirm that you want to copy ${selected.trader_name}. Returns are not guaranteed.`}
              onSuccess={refresh}
            />
          </div>
          <button className={s.close} onClick={() => setSelected(null)}>
            Cancel
          </button>
        </section>
      )}
    </>
  );
}
