function generateCoupons(prefix = "T", count = 100) {
  const coupons = [];
  for (let i = 0; i < count; i++) {
    let code = prefix + Math.floor(Math.random() * 1_000_000_0000).toString().padStart(10, "0");
    coupons.push(code);
  }
  return coupons;
}
module.exports = { generateCoupons };
