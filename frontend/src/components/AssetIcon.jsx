import { useId } from "react";
import s from "./AssetIcon.module.css";

export default function AssetIcon({ asset, size = 36, className = "" }) {
  const symbol = String(asset || "").toUpperCase();
  const gradientId = useId().replaceAll(":", "");
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    role: "img",
    "aria-label": `${symbol || "Crypto"} icon`,
    className: `${s.icon} ${className}`,
  };

  if (symbol === "ETH") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#627eea"/><path d="M20 6.5 11.6 20 20 24.8 28.4 20 20 6.5Z" fill="#fff" fillOpacity=".92"/><path d="m20 26.4-8.4-4.8L20 33.5l8.4-11.9-8.4 4.8Z" fill="#fff" fillOpacity=".72"/></svg>;
  if (symbol === "USDT") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#26a17b"/><path d="M9 10h22v5h-8v2.6c5.4.3 9.4 1.4 9.4 2.8s-4 2.5-9.4 2.8V31h-6v-7.8c-5.4-.3-9.4-1.4-9.4-2.8s4-2.5 9.4-2.8V15H9v-5Zm11 11c5.3 0 8.7-.5 10.2-.9-1.2-.4-3.7-.8-7.2-1v2.2h-6v-2.2c-3.5.2-6 .6-7.2 1 1.5.4 4.9.9 10.2.9Z" fill="#fff"/></svg>;
  if (symbol === "BNB") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#f3ba2f"/><path d="m20 7 5 5-5 5-5-5 5-5Zm-9 9 5 5-5 5-5-5 5-5Zm18 0 5 5-5 5-5-5 5-5Zm-9 9 5 5-5 5-5-5 5-5Zm0-11 7 7-7 7-7-7 7-7Zm0 5-2 2 2 2 2-2-2-2Z" fill="#171717"/></svg>;
  if (symbol === "LTC") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#345d9d"/><path d="m23.6 7-3 11.2 4.2-1.5-.9 3.4-4.2 1.5-1.6 6h11.3l-1.1 4.2H11.5l2.2-8.1-3.2 1.2.9-3.4 3.2-1.2L18.2 7h5.4Z" fill="#fff"/></svg>;
  if (symbol === "DOGE") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#c2a633"/><path d="M13 8h8.2c7 0 11.3 4.2 11.3 12s-4.3 12-11.3 12H13v-9H9v-5h4V8Zm6 5v5h5v5h-5v4h2c3.5 0 5.5-2.4 5.5-7s-2-7-5.5-7h-2Z" fill="#fff"/></svg>;
  if (symbol === "XRP") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#20292f"/><path d="M10 10h5l5 5 5-5h5L22.5 17.5a3.5 3.5 0 0 1-5 0L10 10Zm20 20h-5l-5-5-5 5h-5l7.5-7.5a3.5 3.5 0 0 1 5 0L30 30Z" fill="#fff"/></svg>;
  if (symbol === "SHIB") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#f0652f"/><path d="m8 10 7 3 5-5 5 5 7-3-2 9c1 9-4 14-10 14S8 28 10 19l-2-9Z" fill="#fff3dc"/><path d="m12 14 4 2-3 4-1-6Zm16 0-4 2 3 4 1-6Z" fill="#26262b"/><circle cx="16" cy="22" r="1.5" fill="#26262b"/><circle cx="24" cy="22" r="1.5" fill="#26262b"/><path d="m17 27 3 2 3-2-3-2-3 2Z" fill="#26262b"/></svg>;
  if (symbol === "SOL") return <svg {...common}><defs><linearGradient id={gradientId} x1="5" y1="34" x2="35" y2="6"><stop stopColor="#00ffa3"/><stop offset="1" stopColor="#dc1fff"/></linearGradient></defs><circle cx="20" cy="20" r="19" fill="#111"/><path d="M11 10h19l-4 5H7l4-5Zm3 7.5h19l-4 5H10l4-5Zm-3 7.5h19l-4 5H7l4-5Z" fill={`url(#${gradientId})`}/></svg>;
  if (symbol === "ADA") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#173f72"/><g fill="#fff"><circle cx="20" cy="20" r="3"/><circle cx="20" cy="11" r="1.8"/><circle cx="20" cy="29" r="1.8"/><circle cx="11" cy="20" r="1.8"/><circle cx="29" cy="20" r="1.8"/><circle cx="13.6" cy="13.6" r="1.5"/><circle cx="26.4" cy="13.6" r="1.5"/><circle cx="13.6" cy="26.4" r="1.5"/><circle cx="26.4" cy="26.4" r="1.5"/><circle cx="20" cy="6.5" r="1"/><circle cx="20" cy="33.5" r="1"/><circle cx="6.5" cy="20" r="1"/><circle cx="33.5" cy="20" r="1"/><circle cx="10.5" cy="10.5" r="1"/><circle cx="29.5" cy="10.5" r="1"/><circle cx="10.5" cy="29.5" r="1"/><circle cx="29.5" cy="29.5" r="1"/></g></svg>;
  if (symbol === "AVAX") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#e84142"/><path d="M20 7.5c1.2 0 2 .7 2.6 1.8l9.1 16.1c.7 1.2.1 2.6-1.3 2.6h-5.2c-1.2 0-2-.6-2.6-1.7l-1.9-3.5c-.5-.9-.5-2 0-2.9l2.8-5-1.4-2.5-8 14c-.6 1-1.4 1.6-2.6 1.6H8.8c-1.4 0-2-1.4-1.3-2.6l9.9-16.1C18 8.2 18.8 7.5 20 7.5Z" fill="#fff"/><circle cx="28.6" cy="29.5" r="2.5" fill="#fff"/></svg>;
  if (symbol === "LINK") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#f5f7fb"/><path d="m20 6 12.1 7v14L20 34 7.9 27V13L20 6Zm0 5.8-7.1 4.1v8.2l7.1 4.1 7.1-4.1v-8.2L20 11.8Z" fill="#2a5ada"/></svg>;
  if (symbol === "BTC") return <svg {...common}><circle cx="20" cy="20" r="19" fill="#f7931a"/><text x="20" y="27" textAnchor="middle" fontSize="23" fontWeight="700" fill="#fff">₿</text></svg>;
  return <svg {...common}><circle cx="20" cy="20" r="19" fill="#253029"/><text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#b3f6aa">{symbol.slice(0, 2)}</text></svg>;
}
