const PQueue = require("p-queue");
const { checkCoupon } = require("./checker");

async function processCoupons(coupons, tokenOrCookie, pinCode, concurrency = 3) {
  const queue = new PQueue({ concurrency });
  const results = [];

  coupons.forEach(coupon => {
    queue.add(async () => {
      const result = await checkCoupon(coupon, tokenOrCookie, pinCode);
      results.push(result);
      console.log(`${result.coupon} => ${result.status}`);
    });
  });

  await queue.onIdle();
  return results;
}

module.exports = { processCoupons };
