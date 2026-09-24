import { assets } from "../constants/assets";
import AssetIcon from "./AssetIcon";
import s from "./AssetBalances.module.css";
export default function AssetBalances({ balances = {} }) {
  return (
    <div className={s.viewport} role="region" aria-label="Crypto balances" tabIndex="0">
      <div className={s.grid}>
        {assets.map((asset) => (
          <article key={asset}>
            <AssetIcon asset={asset} size={38} />
            <div>
              <h3>{asset}</h3>
              <p>
                {balances[asset] ?? "0.00000000"} <small>{asset}</small>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
