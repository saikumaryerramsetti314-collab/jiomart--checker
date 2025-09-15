const express = require("express");
const cors = require("cors");
const { generateBatch } = require("./generator");
const { checkCoupon } = require("./checker");
const { createQueue } = require("./queueManager");

const app = express();
app.use(cors());
app.use(express.json());

let clients = [];
let running = false;

app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.flushHeaders();
  clients.push(res);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

function sendEvent(data) {
  clients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
}

app.post("/start", async (req, res) => {
  const { prefix, count, cartId, authToken, userId, pin, concurrency = 2, delayMs = 500 } = req.body;

  if (!cartId || !authToken || !userId || !pin)
    return res.status(400).json({ error: "Missing required fields" });

  if (running) return res.status(400).json({ error: "A batch is already running" });
  running = true;

  const coupons = generateBatch(prefix || "T", count);
  const queue = createQueue(concurrency, delayMs);

  coupons.forEach(coupon => {
    queue.add(async () => {
      const result = await checkCoupon({ coupon, cartId, authToken, userId, pin });
      sendEvent(result);
    });
  });

  queue.onIdle().then(() => { running = false; });
  res.json({ status: "started", total: coupons.length });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
