const PQueue = require("p-queue").default;
const { checkCoupon } = require("./checker");

function* generateCoupons(prefix, count) {
  for (let i = 0; i < count; i++) {
    const number = Math.floor(1000000000 + Math.random() * 9000000000);
    yield `${prefix}${number}`;
  }
}

async function processCoupons({ prefix = "T", count = 10, userId, cartId, authToken, pin, concurrency = 2, retries = 1 }) {
  const queue = new PQueue({ concurrency });
  const coupons = generateCoupons(prefix, count);

  for (let coupon of coupons) {
    queue.add(async () => {
      let attempt = 0;
      let result;

      while (attempt <= retries) {
        result = await checkCoupon({ coupon, userId, cartId, authToken, pin });
        if (result.status === "success") break;
        attempt++;
      }

      // Send result to all connected clients
      global.clients.forEach(client =>
        client.write(`data: ${JSON.stringify(result)}\n\n`)
      );
    });
  }
}

module.exports = { processCoupons };
