// generator.js
// Generates coupons with optional prefix, validates final length 11 (default T + 10 digits)

function generateCoupons(prefix = "T", count = 100) {
  // ensure prefix is a string
  prefix = String(prefix || "T");

  // Determine digits needed to make total length 11
  const digitsNeeded = 11 - prefix.length;
  if (digitsNeeded <= 0) throw new Error("Prefix too long. Total coupon length must be 11.");

  const max = Math.pow(10, digitsNeeded);
  const coupons = [];

  for (let i = 0; i < count; i++) {
    // generate a zero-padded number of digitsNeeded length
    const num = Math.floor(Math.random() * max).toString().padStart(digitsNeeded, "0");
    coupons.push(prefix + num);
  }
  return coupons;
}

module.exports = { generateCoupons };
