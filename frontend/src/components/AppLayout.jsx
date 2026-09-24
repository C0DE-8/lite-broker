import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiLayers,
  FiCreditCard,
  FiActivity,
  FiUsers,
  FiMapPin,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiArrowUpRight,
  FiTrendingUp,
} from "react-icons/fi";
import { Brand, Button } from "./UI";
import { session } from "../api/client";
import { adminSession } from "../api/admin";
import s from "./AppLayout.module.css";
const links = [
  ["/app", "Overview", FiGrid],
  ["/app/investments", "Investments", FiLayers],
  ["/app/wallet", "Wallet", FiCreditCard],
  ["/app/trading", "Trading", FiActivity],
  ["/app/copy-trading", "Copy trading", FiUsers],
  ["/app/settings", "Account settings", FiSettings],
];
const adminLinks = [
  ["/admin", "Admin overview", FiGrid],
  ["/admin/users", "Investors", FiUsers],
  ["/admin/plans", "Investment plans", FiLayers],
  ["/admin/investments", "Investments", FiTrendingUp],
  ["/admin/wallet-addresses", "Wallet addresses", FiMapPin],
  ["/admin/approvals", "Review requests", FiCreditCard],
  ["/admin/activity", "Activity logs", FiActivity],
  ["/admin/profile", "Admin profile", FiUser],
];
export default function AppLayout({ preview = false, admin = false }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className={s.layout}>
      <aside className={`${s.sidebar} ${open ? s.open : ""}`}>
        <div className={s.brandRow}>
          <Brand />
          <button onClick={() => setOpen(false)} aria-label="Close navigation">
            <FiX />
          </button>
        </div>
        <span className={s.label}>YOUR WORKSPACE</span>
        <nav>
          {(admin ? adminLinks : links).map(([to, label, Icon]) => (
            <NavLink
              key={to}
              end={to === "/app" || to === "/admin"}
              to={preview ? "/register" : to}
              className={({ isActive }) => (isActive ? s.active : "")}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={s.sidebarBottom}>
          <div>
            <FiArrowUpRight />
            <h3>
              A little vision.
              <br />A bigger future.
            </h3>
            <p>Your next chapter is yours.</p>
          </div>
          {preview ? (
            <Button to="/register">Create an account</Button>
          ) : (
            <button
              className={s.logout}
              onClick={() => {
                (admin ? adminSession : session).clear();
                navigate(admin ? "/admin/login" : "/login");
              }}
            >
              <FiLogOut /> Log out
            </button>
          )}
        </div>
      </aside>
      {open && (
        <button
          className={s.overlay}
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className={s.body}>
        <header className={s.topbar}>
          <button
            className={s.menu}
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <FiMenu />
          </button>
          <span>
            Workspace <span>/</span>{" "}
            {admin ? "Administration" : "Personal account"}
          </span>
          <div>
            <span className={s.dot} />
            {admin
              ? "Admin workspace"
              : preview
                ? "Platform preview"
                : "Investment workspace"}
            <span className={s.avatar}>{preview ? "P" : "VI"}</span>
          </div>
        </header>
        {preview && (
          <div className={s.banner}>
            You’re exploring a preview. All balances and activity shown are
            illustrative.
            <NavLink to="/register">
              Create your account <FiArrowUpRight />
            </NavLink>
          </div>
        )}
        <main className={s.content}>
          <Outlet />
        </main>
        <footer className={s.footer}>
          © {new Date().getFullYear()} Valthera Investments{" "}
          <span>Investing involves risk. Returns are not guaranteed.</span>
          <NavLink to="/terms">Terms &amp; investment policy</NavLink>
        </footer>
      </div>
    </div>
  );
}
