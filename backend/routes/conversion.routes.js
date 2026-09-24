const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

const ASSETS = new Set([
  "BTC",
  "ETH",
  "USDT",
  "BNB",
  "LTC",
  "DOGE",
  "XRP",
  "SHIB",
  "SOL",
]);
const quoteCache = new Map();

async function marketPrice(asset) {
  if (asset === "USDT") return { price: 1, source: "USD stable value" };
  const cached = quoteCache.get(asset);
  if (cached && Date.now() - cached.fetchedAt < 15000) return cached;
  const response = await fetch(
    `https://data-api.binance.vision/api/v3/ticker/price?symbol=${asset}USDT`,
    { signal: AbortSignal.timeout(12000) },
  );
  if (!response.ok) throw new Error("Market provider unavailable");
  const data = await response.json();
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Invalid market price");
  const quote = { price, source: "Binance", fetchedAt: Date.now() };
  quoteCache.set(asset, quote);
  return quote;
}

function parseRequest(body) {
  const direction = String(body.direction || "").toLowerCase();
  const asset = String(body.asset || "").toUpperCase();
  const rawAmount = String(body.amount ?? "").trim();
  const decimals = direction === "buy" ? 2 : 8;
  const pattern = new RegExp(`^\\d{1,18}(?:\\.\\d{1,${decimals}})?$`);
  if (
    !["buy", "sell"].includes(direction) ||
    !ASSETS.has(asset) ||
    !pattern.test(rawAmount) ||
    Number(rawAmount) <= 0
  ) {
    return null;
  }
  return { direction, asset, amount: Number(rawAmount) };
}

function conversionValues(request, price) {
  if (request.direction === "buy") {
    const received = Number((request.amount / price).toFixed(8));
    return { sourceAmount: request.amount, receivedAmount: received };
  }
  const received = Number((request.amount * price).toFixed(2));
  return { sourceAmount: request.amount, receivedAmount: received };
}

router.get("/conversions/quote", auth, async (req, res) => {
  const request = parseRequest(req.query);
  if (!request)
    return res.status(400).json({ message: "Choose buy or sell, a supported asset, and a valid amount." });
  try {
    const quote = await marketPrice(request.asset);
    const values = conversionValues(request, quote.price);
    if (values.receivedAmount <= 0)
      return res.status(400).json({ message: "The amount is too small to convert." });
    res.json({
      ...request,
      ...values,
      price: quote.price,
      source: quote.source,
      quoted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[conversions.quote]", error);
    res.status(503).json({ message: "A current conversion price is unavailable. Please retry." });
  }
});

router.get("/conversions", auth, async (req, res) => {
  try {
    const [conversions] = await db.query(
      "SELECT id,direction,asset,source_amount,received_amount,price_usd,price_source,created_at FROM crypto_conversions WHERE user_id=? ORDER BY id DESC LIMIT 50",
      [req.user.id],
    );
    res.json({ conversions });
  } catch (error) {
    console.error("[conversions.list]", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(503).json({
        message: "Conversion history is unavailable until the crypto conversion migration is applied.",
      });
    }
    res.status(500).json({ message: "Unable to load conversion history" });
  }
});

router.post("/conversions", auth, async (req, res) => {
  const request = parseRequest(req.body);
  if (!request)
    return res.status(400).json({ message: "Choose buy or sell, a supported asset, and a valid amount." });

  let quote;
  try {
    quote = await marketPrice(request.asset);
  } catch (error) {
    console.error("[conversions.price]", error);
    return res.status(503).json({ message: "A current conversion price is unavailable. No funds were changed." });
  }
  const values = conversionValues(request, quote.price);
  if (values.receivedAmount <= 0)
    return res.status(400).json({ message: "The amount is too small to convert." });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[user]] = await connection.query(
      "SELECT main_balance,withdraw_hold FROM users WHERE id=? FOR UPDATE",
      [req.user.id],
    );
    if (!user) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    await connection.query(
      "INSERT INTO user_crypto_balances (user_id,asset,balance) VALUES (?,?,0) ON DUPLICATE KEY UPDATE asset=VALUES(asset)",
      [req.user.id, request.asset],
    );
    const [[crypto]] = await connection.query(
      "SELECT balance FROM user_crypto_balances WHERE user_id=? AND asset=? FOR UPDATE",
      [req.user.id, request.asset],
    );

    if (request.direction === "buy") {
      const available = Number(user.main_balance) - Number(user.withdraw_hold || 0);
      if (available < values.sourceAmount) {
        await connection.rollback();
        return res.status(400).json({ message: "Insufficient available balance for this conversion." });
      }
      await connection.query("UPDATE users SET main_balance=main_balance-? WHERE id=?", [values.sourceAmount, req.user.id]);
      await connection.query("UPDATE user_crypto_balances SET balance=balance+? WHERE user_id=? AND asset=?", [values.receivedAmount, req.user.id, request.asset]);
    } else {
      if (Number(crypto.balance) < values.sourceAmount) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient ${request.asset} balance for this conversion.` });
      }
      await connection.query("UPDATE user_crypto_balances SET balance=balance-? WHERE user_id=? AND asset=?", [values.sourceAmount, req.user.id, request.asset]);
      await connection.query("UPDATE users SET main_balance=main_balance+? WHERE id=?", [values.receivedAmount, req.user.id]);
    }

    const [created] = await connection.query(
      "INSERT INTO crypto_conversions (user_id,direction,asset,source_amount,received_amount,price_usd,price_source) VALUES (?,?,?,?,?,?,?)",
      [req.user.id, request.direction, request.asset, values.sourceAmount, values.receivedAmount, quote.price, quote.source],
    );
    await connection.commit();
    res.status(201).json({
      message: request.direction === "buy" ? `${request.asset} purchased successfully` : `${request.asset} sold successfully`,
      conversion_id: created.insertId,
      ...request,
      ...values,
      price: quote.price,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[conversions.create]", error);
    res.status(500).json({ message: "Unable to complete conversion. No funds were changed." });
  } finally {
    connection.release();
  }
});

module.exports = router;
