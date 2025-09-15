// queueManager.js
const PQueue = require("p-queue").default;
const { checkCouponWithApi } = require("./checker");
const fs = require("fs");
const path = require("path");

async function processJob({ jobId, coupons, cartId, authToken, userId, pin, concurrency = 3, retries = 2, delayMin = 200, delayMax = 700, progressCallback }) {
  const queue = new PQueue({ concurrency });
  const results = [];
  const resultsDir = path.join(__dirname, "results");
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

  function randomDelay() {
    const ms = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
    return new Promise(r => setTimeout(r, ms));
  }

  for (const coupon of coupons) {
    queue.add(async () => {
      // Validate coupon format server-side: must be length 11
      if (!coupon || coupon.length !== 11) {
        const res = { coupon, status: "Error", reason: "Invalid coupon format (must be length 11)" };
        results.push(res);
        if (progressCallback) progressCallback(res);
        return;
      }

      let attempt = 0;
      while (attempt <= retries) {
        if (attempt > 0) {
          // exponential backoff before retry
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
        }
        attempt++;
        await randomDelay();
        const apiRes = await checkCouponWithApi(coupon, cartId, authToken, userId, pin);
        // if Error due to rate limit or network, we'll retry
        if (apiRes.status === "Error" && attempt <= retries) {
          // continue to retry
          // if reason is 401 or invalid auth, break (no point retrying)
          const reasonLower = (apiRes.reason || "").toString().toLowerCase();
          if (reasonLower.includes("401") || reasonLower.includes("unauthorized") || reasonLower.includes("invalid token") || reasonLower.includes("forbidden")) {
            // auth issue — don't retry
            results.push(apiRes);
            if (progressCallback) progressCallback(apiRes);
            break;
          }
          // else try again
          continue;
        } else {
          // Valid or Invalid or final Error
          results.push(apiRes);
          if (progressCallback) progressCallback(apiRes);
          break;
        }
      }
    });
  }

  await queue.onIdle();

  // Persist results to disk
  const valid = results.filter(r => r.status === "Valid");
  const invalid = results.filter(r => r.status === "Invalid");
  const errors = results.filter(r => r.status === "Error");

  fs.writeFileSync(path.join(resultsDir, `${jobId}_valid.json`), JSON.stringify(valid, null, 2));
  fs.writeFileSync(path.join(resultsDir, `${jobId}_invalid.json`), JSON.stringify(invalid, null, 2));
  fs.writeFileSync(path.join(resultsDir, `${jobId}_errors.json`), JSON.stringify(errors, null, 2));
  fs.writeFileSync(path.join(resultsDir, `${jobId}_all.json`), JSON.stringify(results, null, 2));

  return { results, counts: { total: results.length, valid: valid.length, invalid: invalid.length, errors: errors.length } };
}

module.exports = { processJob };
