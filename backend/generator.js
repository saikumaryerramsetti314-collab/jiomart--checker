function generateCoupons(prefix = "T", count = 10) {
  let coupons = [];
  for (let i = 0; i < count; i++) {
    let number = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digits
    coupons.push(prefix + number);
  }
  return coupons;
}

module.exports = generateCoupons;
