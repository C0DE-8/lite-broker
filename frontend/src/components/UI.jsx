import { useId } from "react";
import { FiArrowUpRight, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import CustomSelect from "./CustomSelect";
import s from "./UI.module.css";
export function Brand() {
  return (
    <Link to="/" className={s.brand} aria-label="Valthera Investments home">
      <span className={s.mark}>
        <FiArrowUpRight />
      </span>
      <span className={s.wordmark}>
        Valthera<span className={s.light}>Investments</span>
      </span>
      <span className={s.dot}>®</span>
    </Link>
  );
}
export function Button({ children, to, secondary, ...props }) {
  const cls = `${s.button} ${secondary ? s.secondary : ""}`;
  return to ? (
    <Link className={cls} to={to} {...props}>
      {children}
    </Link>
  ) : (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
export function Heading({ eyebrow, title, children, action }) {
  return (
    <div className={s.heading}>
      <div>
        {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Status({ loading, error, retry, skeletonCount = 3, variant = "cards" }) {
  return loading ? (
    <div className={`${s.loadingState} ${s[`loading_${variant}`] || ""}`} role="status" aria-live="polite" aria-busy="true">
      <span className={s.loadingLabel}>
        <span className={s.spinner} />
        Loading your information…
      </span>
      <div className={s.skeletonGrid} aria-hidden="true">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <article className={s.skeletonCard} key={index}>
            <div className={s.skeletonTop}>
              <span className={s.skeletonIcon} />
              <span className={s.skeletonShort} />
            </div>
            <span className={s.skeletonValue} />
            <span className={s.skeletonLine} />
            <span className={s.skeletonLineSmall} />
          </article>
        ))}
      </div>
    </div>
  ) : error ? (
    <div className={s.error} role="alert">
      <FiAlertCircle />
      {error}
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  ) : null;
}
export function Empty({ children = "Your activity will appear here." }) {
  return (
    <div className={s.empty}>
      <FiArrowUpRight />
      <h3>A fresh start.</h3>
      <p>{children}</p>
    </div>
  );
}
export function Field({ label, name, as, children, ...props }) {
  const fieldId = useId();
  const id = props.id || `${fieldId}-control`;
  const labelId = `${fieldId}-label`;
  if (as === "select") {
    return (
      <div className={s.field}>
        <span id={labelId}>{label}</span>
        <CustomSelect
          {...props}
          id={id}
          name={name}
          aria-labelledby={labelId}
        >
          {children}
        </CustomSelect>
      </div>
    );
  }
  const Tag = as || "input";
  return (
    <label className={s.field}>
      <span>{label}</span>
      <Tag id={id} name={name} {...props}>
        {children}
      </Tag>
    </label>
  );
}
export { CustomSelect };
export function ArrowLink({ to, children }) {
  return (
    <Link className={s.arrowLink} to={to}>
      {children}
      <FiArrowRight />
    </Link>
  );
}
export function Chart({ small = false }) {
  const gradientId = useId();
  return (
    <svg
      className={small ? s.smallChart : s.chart}
      viewBox="0 0 600 190"
      role="img"
      aria-label="Illustrative portfolio growth chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#b3f6aa" stopOpacity=".22" />
          <stop offset="1" stopColor="#b3f6aa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {!small &&
        [35, 85, 135, 185].map((y) => (
          <path
            key={y}
            d={`M0 ${y}H600`}
            stroke="#ffffff0b"
            strokeDasharray="4 5"
          />
        ))}
      <path
        d="M0 164 L20 157 L36 167 L56 139 L72 148 L89 130 L107 135 L125 115 L140 125 L160 121 L179 143 L199 117 L216 110 L236 121 L251 89 L270 102 L293 88 L310 96 L330 64 L350 74 L372 60 L390 77 L409 53 L430 65 L449 35 L468 43 L490 31 L512 51 L530 22 L550 32 L570 16 L600 7 L600 190 L0 190Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 164 L20 157 L36 167 L56 139 L72 148 L89 130 L107 135 L125 115 L140 125 L160 121 L179 143 L199 117 L216 110 L236 121 L251 89 L270 102 L293 88 L310 96 L330 64 L350 74 L372 60 L390 77 L409 53 L430 65 L449 35 L468 43 L490 31 L512 51 L530 22 L550 32 L570 16 L600 7"
        fill="none"
        stroke="#b3f6aa"
        strokeWidth="2.5"
      />
    </svg>
  );
}
