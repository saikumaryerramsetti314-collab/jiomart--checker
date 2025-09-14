const axios = require("axios");

async function checkCoupon(coupon, tokenOrCookie, pinCode, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        "https://www.jiomart.com/api/check-coupon",
        { coupon, pinCode },
        { headers: { Authorization: `Bearer ${tokenOrCookie}` } }
      );
      if (response.data.valid) return { coupon, status: "Valid" };
      else return { coupon, status: "Invalid", reason: response.data.message };
    } catch (err) {
      if (attempt === retries) return { coupon, status: "Error", reason: err.message };
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
    }
  }
}
module.exports = { checkCoupon };
