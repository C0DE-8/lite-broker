import { useState, useEffect } from "react";
import {
  FiArrowUpRight,
  FiArrowDownRight,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { money } from "../utils/format";
import { useApi } from "../hooks/useApi";
import { api } from "../api/client";
import { Heading, Status, Empty, Field, Button } from "../components/UI";
import ActionForm from "../components/ActionForm";
import MarketChart from "../components/MarketChart";
import TradingStrength from "../components/TradingStrength";
import AssetIcon from "../components/AssetIcon";
import s from "./Trading.module.css";
export default function Trading() {
  const [asset, setAsset] = useState("BTC"),
    [side, setSide] = useState("up"),
    [amount, setAmount] = useState("25"),
    [duration, setDuration] = useState("60"),
    [now, setNow] = useState(() => Date.now()),
    [settling, setSettling] = useState(false),
    [settleError, setSettleError] = useState("");
  const history = useApi("/binary-trades"),
    profile = useApi("/me");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const trades = history.data?.trades || [],
    open = trades.filter((t) => t.status === "open"),
    expired = open.some((t) => Number(t.expires_at_ms) + 2000 < now);
  function refresh() {
    history.reload();
    profile.reload();
  }
  async function settle() {
    setSettling(true);
    setSettleError("");
    try {
      const result = await api.post("/binary-trades/settle", {});
      if (result.unavailable) setSettleError(result.message);
      refresh();
    } catch (e) {
      setSettleError(e.message);
    } finally {
      setSettling(false);
    }
  }
  const balance = profile.data
    ? Math.max(
        0,
        Number(profile.data.user.main_balance) -
          Number(profile.data.user.withdraw_hold || 0),
      )
    : 0;
  const rate = history.data?.payout_percent ?? 80;
  return (
    <>
      <Heading
        eyebrow="PRACTICE TRADING TERMINAL"
        title="Make your next move."
        action={<span className={s.demo}>LIVE TRADE</span>}
      >
        Follow the market. Choose a direction. Review every contract.
      </Heading>
      <div className={s.terminal}>
        <section className={s.chartPanel}>
          <div className={s.chartHeading}>
            <div className={s.assetTitle}>
              <AssetIcon asset={asset} size={34} />
              <div>
                <strong>{asset} / USDT</strong>
                <span>Binance · Exchange prices</span>
              </div>
            </div>
            <span>
              <FiClock />
              24h overview
            </span>
          </div>
          <div className={s.liveChart}>
            <MarketChart
              key={asset}
              asset={asset}
              symbol={`BINANCE:${asset}USDT`}
              advanced
            />
          </div>
          <div className={s.chartFoot}>
            Switch to TradingView for candlesticks, timeframes, and drawing
            tools.
          </div>
        </section>
        <section className={s.ticket}>
          <div className={s.ticketHead}>
            <h3>Up / Down contract</h3>
            <span>{money(balance)} available</span>
          </div>
          <Status
            loading={profile.loading}
            error={profile.error}
            retry={profile.reload}
          />
          {profile.data && profile.data.user.trading_status !== "active" ? (
            <p className={s.notice}>
              Trading is {profile.data.user.trading_status}. Contact your
              account administrator.
            </p>
          ) : (
            <ActionForm
              endpoint="/binary-trades"
              label="Review practice contract"
              review
              reviewText={`Practice only. ${side === "up" ? "Up" : "Down"} on ${asset}/USDT, ${duration} seconds. A win returns your stake plus ${rate}%; a loss loses the stake; a tie refunds it. Entry and expiry prices come from the exchange.`}
              onSuccess={() => {
                refresh();
                setAmount("25");
              }}
            >
              <Field
                label="Market"
                name="asset"
                as="select"
                assetIcons
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              >
                <option value="BTC">Bitcoin · BTC / USDT</option>
                <option value="ETH">Ethereum · ETH / USDT</option>
                <option value="SOL">Solana · SOL / USDT</option>
              </Field>
              <div
                className={s.direction}
                role="group"
                aria-label="Contract direction"
              >
                <button
                  type="button"
                  aria-pressed={side === "up"}
                  className={side === "up" ? s.up : ""}
                  onClick={() => setSide("up")}
                >
                  <FiArrowUpRight />
                  Up
                </button>
                <button
                  type="button"
                  aria-pressed={side === "down"}
                  className={side === "down" ? s.down : ""}
                  onClick={() => setSide("down")}
                >
                  <FiArrowDownRight />
                  Down
                </button>
              </div>
              <input type="hidden" name="side" value={side} />
              <Field
                label="Test stake (USD)"
                name="amount"
                type="number"
                min="1"
                max={Math.min(balance, 1000000)}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <label className={s.consent}>
                <input
                  name="risk_acknowledged"
                  type="checkbox"
                  value="yes"
                  required
                />
                I understand this practice contract can lose its test stake and
                that live returns are never guaranteed.
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
              <div
                className={s.durations}
                role="group"
                aria-label="Contract expiry"
              >
                {[
                  ["30", "30s"],
                  ["60", "1m"],
                  ["300", "5m"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={duration === value ? s.selected : ""}
                    aria-pressed={duration === value}
                    onClick={() => setDuration(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="duration" value={duration} />
              <div className={s.terms}>
                <span>
                  Profit if correct{" "}
                  <strong>
                    +{money(((Number(amount) || 0) * rate) / 100)}
                  </strong>
                </span>
                <span>
                  Total return if correct{" "}
                  <strong>
                    {money((Number(amount) || 0) * (1 + rate / 100))}
                  </strong>
                </span>
                <span>
                  Maximum loss <strong>{money(amount)}</strong>
                </span>
              </div>
            </ActionForm>
          )}
          <p className={s.note}>
            Practice contracts use local test balances. This does not place an
            order on an exchange. Settlement uses the one-second candle close at
            expiry; it waits if that price is unavailable.
          </p>
        </section>
      </div>
      {profile.data && <TradingStrength user={profile.data.user} />}
      <section className={s.panel}>
        <div className={s.heading}>
          <div>
            <h3>Your contracts</h3>
            <span>
              {open.length} open · {trades.length} recent
            </span>
          </div>
          <div className={s.actions}>
            {expired && (
              <Button disabled={settling} onClick={settle}>
                {settling ? "Settling…" : "Settle expired contracts"}
              </Button>
            )}
            <button onClick={refresh} aria-label="Refresh contracts">
              <FiRefreshCw />
            </button>
          </div>
        </div>
        <Status {...history} retry={history.reload} variant="table" skeletonCount={1} />
        <Status error={settleError} />
        {history.data &&
          (trades.length ? (
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Direction</th>
                    <th>Stake</th>
                    <th>Entry price</th>
                    <th>Expiry / result</th>
                    <th>P / L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => {
                    const seconds = Math.max(
                      0,
                      Math.ceil((Number(t.expires_at_ms) - now) / 1000),
                    );
                    return (
                      <tr key={t.id}>
                        <td>{t.asset}/USDT</td>
                        <td
                          className={t.side === "up" ? s.positive : s.negative}
                        >
                          {t.side === "up" ? "↗ Up" : "↘ Down"}
                        </td>
                        <td>{money(t.amount)}</td>
                        <td>
                          {Number(t.entry_price).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          {t.status === "open"
                            ? seconds
                              ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                              : "Awaiting settlement"
                            : t.status}
                        </td>
                        <td
                          className={
                            Number(t.pnl) < 0 ? s.negative : s.positive
                          }
                        >
                          {t.pnl == null ? "—" : money(t.pnl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Your practice contracts will appear here.</Empty>
          ))}
      </section>
    </>
  );
}
