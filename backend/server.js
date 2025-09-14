const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateCoupons } = require("./generator");
const { processCoupons } = require("./queueManager");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/start", async (req, res) => {
  const { prefix, count, tokenOrCookie, pinCode } = req.body;
  const coupons = generateCoupons(prefix || "T", count);
  const results = await processCoupons(coupons, tokenOrCookie, pinCode);
  res.json({ results });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
