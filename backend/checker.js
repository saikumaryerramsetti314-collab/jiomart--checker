const axios = require("axios");

async function checkCoupon({ coupon, cartId, authToken, userId, pin }) {
  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const res = await axios.get(
        "https://www.jiomart.com/mst/rest/v1/5/cart/apply_coupon",
        {
          params: { coupon_code: coupon, cart_id: cartId },
          headers: {
            authtoken: authToken,
            userid: userId,
            pin: pin,
            Accept: "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          },
          timeout: 10000
        }
      );

      // Success response
      if (res.data?.status === "success") {
        return { status: "success", coupon, result: res.data };
      } else {
        return { status: "error", coupon, error: res.data?.message || "Invalid coupon" };
      }

    } catch (err) {
      // Retry on network errors or 403
      attempt++;
      if (attempt > maxRetries) {
        return {
          status: "error",
          coupon,
          error: err.response?.status === 403 
                  ? "403 Forbidden: Check your token/cartId/userId/pin" 
                  : err.response?.data || err.message
        };
      }
      // Wait 500ms before retry
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

module.exports = { checkCoupon };
