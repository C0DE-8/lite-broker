import { money } from "../utils/format";
import {
  FiArrowUpRight,
  FiArrowDownLeft,
  FiLayers,
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import {
  Heading,
  Button,
  Status,
  Empty,
  Chart,
  ArrowLink,
} from "../components/UI";
import s from "./Dashboard.module.css";
import TradingStrength from "../components/TradingStrength";
export default function Dashboard({ preview = false }) {
  return preview ? (
    <Overview
      preview
      user={{
        full_name: "Alex Morgan",
        main_balance: 12480.5,
        profit_balance: 1842.36,
        investment_balance: 12199.99,
      }}
      investments={[]}
    />
  ) : (
    <LiveDashboard />
  );
}
function LiveDashboard() {
  const profile = useApi("/me"),
    investments = useApi("/investments");
  if (profile.loading) return <DashboardSkeleton />;
  if (profile.error)
    return <Status error={profile.error} retry={profile.reload} />;
  return (
    <>
      {profile.data && (
        <Overview
          user={profile.data.user}
          investments={investments.data?.investments || []}
          investmentsLoading={investments.loading}
          investmentsError={investments.error}
          reloadInvestments={investments.reload}
        />
      )}
    </>
  );
}
function DashboardSkeleton() {
  return (
    <div className={s.dashboardSkeleton} role="status" aria-label="Loading dashboard" aria-busy="true">
      <div className={s.skeletonHeading}><span /><i /><i /></div>
      <div className={s.stats}>{[0, 1, 2].map((item) => <article className={s.skeletonCard} key={item}><span /><strong /><i /></article>)}</div>
      <section className={`${s.panel} ${s.skeletonStrength}`}><span /><strong /><i /></section>
      <div className={s.mainGrid}><section className={`${s.panel} ${s.skeletonPanel}`}><span /><strong /><i /><i /><i /></section><section className={`${s.panel} ${s.skeletonPanel}`}><span /><strong /><i /><i /></section></div>
      <div className={s.lowerGrid}><section className={`${s.panel} ${s.skeletonPanel}`}><span /><i /><i /><i /></section><section className={`${s.panel} ${s.skeletonPanel}`}><span /><i /><i /><i /></section></div>
    </div>
  );
}
function Overview({ user, preview = false, investments, investmentsLoading = false, investmentsError = "", reloadInvestments }) {
  const currencySymbol = user.currency_symbol || "$";
  const total =
    Number(user.main_balance || 0) +
    Number(user.profit_balance || 0) +
    Number(user.investment_balance || 0);
  return (
    <>
      <Heading
        eyebrow="YOUR BIGGER PICTURE"
        title={`Welcome${preview ? " back" : ""}, ${user.full_name?.split(" ")[0] || user.username || "investor"}.`}
        action={
          <Button to={preview ? "/register" : "/app/wallet"}>
            <FiArrowDownLeft />
            Add funds
          </Button>
        }
      >
        A little perspective on where you are, and what’s next.
      </Heading>
      <div className={s.stats}>
        {[
          [FiDollarSign, "Available balance", user.main_balance],
          [FiTrendingUp, "Profit balance", user.profit_balance],
          [FiLayers, "Invested balance", user.investment_balance],
        ].map(([Icon, label, value]) => (
          <article key={label}>
            <div>
              <span>{label}</span>
              <Icon />
            </div>
            <h2>{money(value, currencySymbol)}</h2>
            <span className={s.statNote}>
              {preview ? "Illustrative balance" : `Account balance · ${currencySymbol}`}
            </span>
          </article>
        ))}
      </div>
      {!preview && <TradingStrength user={user} />}
      <div className={s.mainGrid}>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h3>Portfolio overview</h3>
            <span>{preview ? "ILLUSTRATIVE" : "TOTAL BALANCE"}</span>
          </div>
          <h2 className={s.total}>{money(total, currencySymbol)}</h2>
          <p className={s.sub}>
            {preview ? (
              <>
                <span>↗ 8.07%</span> this month · example performance
              </>
            ) : (
              "Combined available, profit, and invested balances"
            )}
          </p>
          {preview ? (
            <>
              <Chart />
              <div className={s.dates}>
                <span>Jun 1</span>
                <span>Jun 8</span>
                <span>Jun 15</span>
                <span>Jun 22</span>
                <span>Jun 30</span>
              </div>
            </>
          ) : (
            <div className={s.allocation}>
              {[
                ["Available", user.main_balance],
                ["Profit", user.profit_balance],
                ["Invested", user.investment_balance],
              ].map(([label, value], i) => (
                <div key={label}>
                  <div>
                    <span>{label}</span>
                    <strong>{money(value, currencySymbol)}</strong>
                  </div>
                  <div className={s.track}>
                    <span
                      style={{
                        width: `${total ? (Number(value) / total) * 100 : 0}%`,
                        opacity: 1 - i * 0.2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className={s.panelFoot}>
            <span>
              <i /> {preview ? "Sample portfolio" : "Your account allocation"}
            </span>
            <Link to={preview ? "/register" : "/app/investments"}>
              View investments <FiArrowUpRight />
            </Link>
          </div>
        </section>
        <section className={`${s.panel} ${s.next}`}>
          <span className={s.eyebrow}>MAKE YOUR NEXT MOVE</span>
          <h2>
            Small steps.
            <br />
            New possibilities.
          </h2>
          <p>
            Give your ambitions a little direction. Explore the investment plans
            available to you.
          </p>
          <div className={s.nextArt}>
            <FiLayers />
          </div>
          <Button to={preview ? "/register" : "/app/investments"}>
            Explore plans <FiArrowUpRight />
          </Button>
        </section>
      </div>
      <div className={s.lowerGrid}>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h3>Your investments</h3>
            <ArrowLink to={preview ? "/register" : "/app/investments"}>
              View all
            </ArrowLink>
          </div>
          {investmentsLoading ? (
            <Status loading variant="table" skeletonCount={1} />
          ) : investmentsError ? (
            <Status error={investmentsError} retry={reloadInvestments} />
          ) : investments.length ? (
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Investment</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.slice(0, 4).map((item) => (
                    <tr key={item.id}>
                      <td>{item.plan_name || `Plan #${item.plan_id}`}</td>
                      <td>{money(item.amount, currencySymbol)}</td>
                      <td>
                        <span className={s.badge}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>
              {preview
                ? "Your investments will be organized here."
                : "Explore available plans to start your first investment."}
            </Empty>
          )}
        </section>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h3>Your next steps</h3>
            <FiArrowUpRight />
          </div>
          {[
            [
              FiShield,
              "Verify your identity",
              "Keep your account up to date.",
              "settings",
            ],
            [
              FiArrowDownLeft,
              "Fund your account",
              "View available deposit methods.",
              "wallet",
            ],
            [
              FiLayers,
              "Explore investment plans",
              "Find a plan to review.",
              "investments",
            ],
          ].map(([Icon, title, text, path]) => (
            <Link
              key={path}
              to={preview ? "/register" : `/app/${path}`}
              className={s.step}
            >
              <span>
                <Icon />
              </span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
              <FiArrowRight />
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
