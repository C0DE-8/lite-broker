import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiArrowRight,
  FiLayers,
  FiShield,
  FiPlus,
  FiMinus,
  FiMenu,
  FiX,
  FiActivity,
  FiCheck,
  FiPause,
  FiPlay,
  FiUserCheck,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import { SiBitcoin, SiEthereum } from "react-icons/si";
import { Brand, Button, ArrowLink } from "../components/UI";
import s from "./Landing.module.css";
import HeroMarketCard from "../components/HeroMarketCard";
import TradingViewMarkets from "../components/TradingViewMarkets";
import SitePreloader from "../components/SitePreloader";
import DemoActivityToast from "../components/DemoActivityToast";
import { session } from "../api/client";
import { CoinTicker, TradingRoutes, BitcoinNews, MiningSection, CommunitySection } from "../components/LandingExtras";
export default function Landing() {
  const loggedIn = Boolean(session.get());
  const [menu, setMenu] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <SitePreloader onReady={setReady} />}
      <div className={s.page} inert={!ready}>
        {ready && <DemoActivityToast />}
        <div className={s.announcement}>
          <span className={s.liveDot} /> A new perspective on investing.{" "}
          <Link to="/register">
            Meet your next chapter <FiArrowUpRight />
          </Link>
        </div>
        <header className={s.header}>
          <Brand />
          <nav className={menu ? s.open : ""}>
            <a href="#possibilities" onClick={() => setMenu(false)}>
              Why Valthera
            </a>
            <a href="#markets" onClick={() => setMenu(false)}>
              Explore markets
            </a>
            <a href="#how-it-works" onClick={() => setMenu(false)}>
              How it works
            </a>
            <a href="#mining" onClick={() => setMenu(false)}>Mining</a>
            <a href="#news" onClick={() => setMenu(false)}>News</a>
            <a href="#faq" onClick={() => setMenu(false)}>
              FAQs
            </a>
          </nav>
          <div className={s.navActions}>
            {loggedIn ? (
              <Button to="/app">
                Dashboard <FiArrowUpRight />
              </Button>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Button to="/register">
                  Get started <FiArrowUpRight />
                </Button>
              </>
            )}
            <button
              className={s.menuButton}
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation"
              aria-expanded={menu}
            >
              {menu ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </header>
        <main>
          <section className={s.hero}>
            <div className={s.heroCopy}>
              <div className={s.pill}>
                <span />
                YOUR FUTURE. MORE POSSIBILITIES.
              </div>
              <h1>
                A little vision.
                <br />A bigger <span>future.</span>
              </h1>
              <p>
                Follow Bitcoin and crypto markets, explore trading and investment
                plans, and see your portfolio in perspective. Your next move
                starts with a clearer view.
              </p>
              <div className={s.heroActions}>
                <Button to="/register">
                  Start your journey <FiArrowUpRight />
                </Button>
                <ArrowLink to="/preview">Explore the platform</ArrowLink>
              </div>
              <div className={s.heroNote}>
                <FiShield /> A clearer view of your investments <span>•</span>{" "}
                All in one place
              </div>
            </div>
            <div
              className={`${s.heroVisual} ${motionPaused ? s.motionPaused : ""}`}
            >
              <div className={s.orbit} aria-hidden="true">
                <span className={s.orbitTrail} />
              </div>
              <div className={s.orbitTwo} aria-hidden="true">
                <span className={s.orbitTrail} />
              </div>
              <div className={s.grid} aria-hidden="true" />
              <button
                type="button"
                className={s.motionToggle}
                onClick={() => setMotionPaused((p) => !p)}
                aria-label={
                  motionPaused
                    ? "Resume hero animation"
                    : "Pause hero animation"
                }
                aria-pressed={motionPaused}
              >
                {motionPaused ? <FiPlay /> : <FiPause />}
              </button>
              <div className={s.floatEth} aria-hidden="true">
                <SiEthereum />
              </div>
              <div className={s.floatBtc} aria-hidden="true">
                <SiBitcoin />
              </div>
              <div className={s.portfolio}>
                <HeroMarketCard />
              </div>
              <div className={s.floatingCard}>
                <span className={s.check}>
                  <FiCheck />
                </span>
                <div>
                  Your next chapter starts here
                  <small>A little progress. Every day.</small>
                </div>
                <FiArrowUpRight />
              </div>
            </div>
          </section>
          <CoinTicker />
          <section className={`${s.section} ${s.confidence}`}>
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>BUILT FOR EVERY STEP</span>
                <h2>
                  More visibility.
                  <br />Less guesswork.
                </h2>
              </div>
              <p>
                From account setup to every submitted request,
                <br />your workspace keeps the important details together.
              </p>
            </div>
            <div className={s.confidenceCards}>
              <article>
                <span className={s.confidenceNumber}>01</span>
                <div className={s.confidenceIcon}><FiUserCheck /></div>
                <h3>Account review</h3>
                <p>
                  Complete your profile and identity details in one place, then
                  follow the review status from your account.
                </p>
                <Link to="/register">Set up your account <FiArrowUpRight /></Link>
              </article>
              <article>
                <span className={s.confidenceNumber}>02</span>
                <div className={s.confidenceIcon}><FiClock /></div>
                <h3>Request tracking</h3>
                <p>
                  See deposit and withdrawal requests with their current status
                  and submission date inside your wallet.
                </p>
                <Link to="/preview">Preview the workspace <FiArrowUpRight /></Link>
              </article>
              <article>
                <span className={s.confidenceNumber}>03</span>
                <div className={s.confidenceIcon}><FiFileText /></div>
                <h3>Clear account records</h3>
                <p>
                  Keep balances, investments, and activity history organized in
                  a dashboard designed for easy review.
                </p>
                <Link to="/register">Start exploring <FiArrowUpRight /></Link>
              </article>
            </div>
          </section>
          <section className={s.section} id="possibilities">
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>BUILT AROUND YOU</span>
                <h2>
                  Your ambitions.
                  <br />
                  Meet your possibilities.
                </h2>
              </div>
              <p>
                From your first investment to your next big move.
                <br />
                The tools to move forward, all together.
              </p>
            </div>
            <div className={s.features}>
              <article>
                <div className={s.featureIcon}>
                  <FiLayers />
                </div>
                <span className={s.number}>01 /</span>
                <h3>One home for your portfolio</h3>
                <p>
                  See your balances, investments, and transaction history in one
                  thoughtfully designed space.
                </p>
                <ArrowLink to="/preview">Find your perspective</ArrowLink>
                <div className={s.stackArt}>
                  <div>
                    <SiBitcoin />
                    <span>Bitcoin</span>
                    <b>BTC</b>
                  </div>
                  <div>
                    <SiEthereum />
                    <span>Ethereum</span>
                    <b>ETH</b>
                  </div>
                </div>
              </article>
              <article>
                <div className={s.featureIcon}>
                  <FiActivity />
                </div>
                <span className={s.number}>02 /</span>
                <h3>A strategy that fits you</h3>
                <p>
                  Explore investment plans and copy trading. Compare the details
                  before choosing your next step.
                </p>
                <ArrowLink to="/register">Explore your options</ArrowLink>
                <div className={s.bars}>
                  {[25, 36, 32, 52, 44, 65, 57, 79, 71, 95, 87, 110].map(
                    (h, i) => (
                      <i key={i} style={{ height: h }} />
                    ),
                  )}
                </div>
              </article>
              <article>
                <div className={s.featureIcon}>
                  <FiShield />
                </div>
                <span className={s.number}>03 /</span>
                <h3>Clarity at every step</h3>
                <p>
                  Track deposit and withdrawal requests, verify your identity,
                  and stay connected to your account.
                </p>
                <ArrowLink to="/register">Make yourself at home</ArrowLink>
                <div className={s.shieldArt}>
                  <div>
                    <FiShield />
                    <FiCheck />
                  </div>
                  <span>YOUR ACCOUNT. YOUR OVERVIEW.</span>
                </div>
              </article>
            </div>
          </section>
          <TradingRoutes />
          <section className={s.section} id="markets">
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>EXPAND YOUR HORIZONS</span>
                <h2>A world that never stands still.</h2>
              </div>
              <ArrowLink to="/register">Explore investments</ArrowLink>
            </div>
            <TradingViewMarkets />
          </section>
          <BitcoinNews />
          <MiningSection />
          <CoinTicker compact />
          <CommunitySection />
          <section className={`${s.section} ${s.steps}`} id="how-it-works">
            <div>
              <span className={s.eyebrow}>SMALL STEPS. NEW POSSIBILITIES.</span>
              <h2>
                Your future starts
                <br />
                with a first step.
              </h2>
              <Button to="/register">
                Let’s get started <FiArrowUpRight />
              </Button>
            </div>
            <div className={s.stepsList}>
              {[
                [
                  "Create your account",
                  "A few details to get you started. Your own space to see the bigger picture.",
                ],
                [
                  "Make it yours",
                  "Verify your identity and fund your account with the available deposit methods.",
                ],
                [
                  "Find your next move",
                  "Explore plans, review the terms, and follow your investments in one place.",
                ],
              ].map(([title, text], i) => (
                <div key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <FiArrowUpRight />
                </div>
              ))}
            </div>
          </section>
          <section className={`${s.section} ${s.faq}`} id="faq">
            <div>
              <span className={s.eyebrow}>A LITTLE MORE CLARITY</span>
              <h2>
                Good questions.
                <br />
                Straight answers.
              </h2>
              <p>Get to know your next investment space.</p>
            </div>
            <div>
              {[
                [
                  "What can I do with Valthera Investments?",
                  "Manage your account, explore investment plans, follow copy traders, place supported trades, and track deposit and withdrawal requests from your dashboard.",
                ],
                [
                  "Can I mine crypto on Valthera today?",
                  "Mining equipment levels, hourly credits, batteries, and account controls are available in the mining workspace. Configure and manage the service from the admin workspace.",
                ],
                [
                  "Are the news and prices live?",
                  "Market quotes come from Binance and refresh approximately every minute. Bitcoin headlines are provided by TradingView. Provider delays and outages can occur; unavailable or delayed quotes are labeled.",
                ],
                [
                  "How do I fund my account?",
                  "After signing in, open Wallet, choose an available asset, and use the deposit address displayed for that asset. Submit your amount and payment proof for review.",
                ],
                [
                  "Are investment returns guaranteed?",
                  "No. Investments and digital assets carry risk, including the loss of capital. Review every plan’s terms and make decisions that suit your circumstances.",
                ],
                [
                  "Is this a self-custody Web3 wallet?",
                  "No. Valthera Investments is an account-based investment platform. The dashboard uses the platform’s balances and deposit addresses; it does not connect to or control a self-custody wallet.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <FiPlus className={s.plus} />
                    <FiMinus className={s.minus} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>
          <section className={s.cta}>
            <div className={s.ctaGlow} />
            <span className={s.eyebrow}>THE NEXT CHAPTER IS YOURS</span>
            <h2>
              Think forward.
              <br />
              <span>Start here.</span>
            </h2>
            <Button to="/register">
              Create your account <FiArrowUpRight />
            </Button>
            <p>A little vision can go a long way.</p>
          </section>
        </main>
        <footer className={s.footer}>
          <div>
            <Brand />
            <span>A clearer perspective. A world of possibilities.</span>
            <a href="#faq">
              Questions? Start here <FiArrowRight />
            </a>
            <Link to="/terms">
              Terms &amp; investment policy <FiArrowRight />
            </Link>
          </div>
          <p>
            Investing involves risk. Asset values can rise or fall, and you may
            lose your capital. Market quotes may be delayed and are not
            investment advice.
          </p>
          <div className={s.copyright}>
            <span>
              © {new Date().getFullYear()} Valthera Investments. All rights
              reserved.
            </span>
            <span>
              Built for your next chapter. <FiArrowUpRight />
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
