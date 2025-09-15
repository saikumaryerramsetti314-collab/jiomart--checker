const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { processCoupons } = require("./queueManager");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// SSE (Server Sent Events) for real-time results
app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.flushHeaders();

  global.clients.push(res);

  req.on("close", () => {
    global.clients = global.clients.filter(c => c !== res);
  });
});

app.post("/start", async (req, res) => {
  const { prefix, count, userId, cartId, authToken, pin, concurrency, retries } = req.body;

  if (!userId || !cartId || !authToken || !pin) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  processCoupons({ prefix, count, userId, cartId, authToken, pin, concurrency, retries });
  res.json({ status: "started", count });
});

global.clients = [];

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://127.0.0.1:${PORT}`));
