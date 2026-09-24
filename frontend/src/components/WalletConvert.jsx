import { useEffect, useState } from "react";
import { api } from "../api/client";
import { assets } from "../constants/assets";
import { money } from "../utils/format";
import { Button, Field } from "./UI";
import s from "./WalletConvert.module.css";

function coin(value, asset) {
  return `${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })} ${asset}`;
}

export default function WalletConvert({ balances, currencySymbol = "$", onSuccess }) {
  const [direction, setDirection] = useState("buy");
  const [asset, setAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const availableCash = Math.max(
    0,
    Number(balances?.main_balance || 0) - Number(balances?.withdraw_hold || 0),
  );
  const cryptoBalance = Number(balances?.crypto_balances?.[asset] || 0);

  useEffect(() => {
    if (!amount || Number(amount) <= 0) {
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoadingQuote(true);
      setQuoteError("");
      try {
        const data = await api.get(
          `/conversions/quote?direction=${encodeURIComponent(direction)}&asset=${encodeURIComponent(asset)}&amount=${encodeURIComponent(amount)}`,
        );
        if (active) setQuote(data);
      } catch (err) {
        if (active) {
          setQuote(null);
          setQuoteError(err.message);
        }
      } finally {
        if (active) setLoadingQuote(false);
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [amount, asset, direction]);

  function resetQuote() {
    setQuote(null);
    setQuoteError("");
    setReviewing(false);
    setMessage("");
    setError("");
  }

  function changeDirection(nextDirection) {
    resetQuote();
    setDirection(nextDirection);
    setAmount("");
  }

  function changeAsset(nextAsset) {
    resetQuote();
    setAsset(nextAsset);
  }

  function changeAmount(nextAmount) {
    resetQuote();
    setAmount(nextAmount);
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await api.post("/conversions", { direction, asset, amount });
      const received =
        direction === "buy"
          ? coin(result.receivedAmount, asset)
          : money(result.receivedAmount, currencySymbol);
      setMessage(`${result.message}. You received ${received}.`);
      setAmount("");
      setQuote(null);
      setReviewing(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      setReviewing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.convert}>
      <div className={s.direction} role="group" aria-label="Conversion direction">
        <button type="button" className={direction === "buy" ? s.active : ""} onClick={() => changeDirection("buy")}>
          Buy crypto
        </button>
        <button type="button" className={direction === "sell" ? s.active : ""} onClick={() => changeDirection("sell")}>
          Sell crypto
        </button>
      </div>
      <div className={s.available}>
        <span>{direction === "buy" ? "Available cash" : `${asset} balance`}</span>
        <strong>{direction === "buy" ? money(availableCash, currencySymbol) : coin(cryptoBalance, asset)}</strong>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); if (quote) setReviewing(true); }}>
        <Field label="Crypto asset" name="asset" as="select" assetIcons value={asset} onChange={(event) => changeAsset(event.target.value)}>
          {assets.map((item) => <option key={item} value={item}>{item}</option>)}
        </Field>
        <Field
          label={direction === "buy" ? "Amount to spend (USD)" : `Amount to sell (${asset})`}
          name="amount"
          type="number"
          min={direction === "buy" ? "0.01" : "0.00000001"}
          max={direction === "buy" ? availableCash : cryptoBalance}
          step={direction === "buy" ? "0.01" : "0.00000001"}
          value={amount}
          onChange={(event) => changeAmount(event.target.value)}
          required
        />
        {quote && (
          <div className={s.quote}>
            <div><span>Current price</span><strong>{money(quote.price, currencySymbol)}</strong></div>
            <div><span>You receive</span><strong>{direction === "buy" ? coin(quote.receivedAmount, asset) : money(quote.receivedAmount, currencySymbol)}</strong></div>
            <small>{quote.source} quote · execution price is refreshed when confirmed</small>
          </div>
        )}
        {loadingQuote && <p className={s.muted}>Getting current price…</p>}
        {quoteError && <p className={s.error} role="alert">{quoteError}</p>}
        <Button type="submit" disabled={!quote || loadingQuote || busy}>Review conversion</Button>
      </form>
      {reviewing && quote && (
        <div className={s.review} role="region" aria-label="Review conversion">
          <h3>Confirm conversion</h3>
          <p>
            {direction === "buy"
              ? `${money(amount, currencySymbol)} will be deducted from your available balance to buy approximately ${coin(quote.receivedAmount, asset)}.`
              : `${coin(amount, asset)} will be sold for approximately ${money(quote.receivedAmount, currencySymbol)}.`}
          </p>
          <small>The final amount may change slightly when the current price is refreshed.</small>
          <div><Button type="button" disabled={busy} onClick={confirm}>{busy ? "Converting…" : "Confirm conversion"}</Button><Button type="button" secondary disabled={busy} onClick={() => setReviewing(false)}>Go back</Button></div>
        </div>
      )}
      {error && <p className={s.error} role="alert">{error}</p>}
      {message && <p className={s.success} role="status">{message}</p>}
    </div>
  );
}
