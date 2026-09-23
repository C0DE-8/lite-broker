import { useEffect, useState } from "react";
import { FiArrowDownLeft, FiTrendingUp } from "react-icons/fi";
import s from "./DemoActivityToast.module.css";

const names = [
  "A*** W.", "T*** R.", "M*** K.", "J*** S.", "L*** D.", "C*** A.",
  "B*** N.", "E*** P.", "R*** H.", "S*** M.", "D*** O.", "K*** T.",
  "P*** G.", "N*** C.", "H*** B.", "V*** L.", "F*** J.", "O*** E.",
  "G*** Y.", "I*** F.", "W*** Q.", "Z*** R.", "U*** V.", "Q*** I.",
];

const firstActivity = { name: "A*** W.", action: "invested", amount: 1250 };

function randomActivity(previousName) {
  const availableNames = names.filter((name) => name !== previousName);
  const name = availableNames[Math.floor(Math.random() * availableNames.length)];
  const action = Math.random() < 0.5 ? "invested" : "withdrew";
  const amount = Math.floor((100 + Math.random() * 24900) / 5) * 5;
  return { name, action, amount };
}

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export default function DemoActivityToast() {
  const [activity, setActivity] = useState(firstActivity);
  const [phase, setPhase] = useState("out");

  useEffect(() => {
    let swapTimer;
    const openingTimer = window.setTimeout(() => setPhase("in"), 500);
    const cycleTimer = window.setInterval(() => {
      setPhase("out");
      swapTimer = window.setTimeout(() => {
        setActivity((current) => randomActivity(current.name));
        setPhase("in");
      }, 2400);
    }, 10000);
    return () => {
      window.clearTimeout(openingTimer);
      window.clearInterval(cycleTimer);
      window.clearTimeout(swapTimer);
    };
  }, []);

  const isWithdrawal = activity.action === "withdrew";

  return (
    <aside className={s.toast} data-phase={phase} aria-label="Demo activity">
      <div className={s.icon} aria-hidden="true">
        {isWithdrawal ? <FiArrowDownLeft /> : <FiTrendingUp />}
      </div>
      <div className={s.copy} aria-live="polite" aria-atomic="true">
        <span>ACTIVITY</span>
        <p>
          <strong>{activity.name}</strong> {activity.action}{" "}
          <b>{formatAmount(activity.amount)}</b>
        </p>
        <small>live transaction</small>
      </div>
    </aside>
  );
}
