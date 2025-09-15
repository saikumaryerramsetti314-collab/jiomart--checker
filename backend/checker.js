const axios = require("axios");

async function checkCoupon({ coupon, cartId, authToken, userId, pin }) {
  try {
    const res = await axios.get(
      "https://www.jiomart.com/mst/rest/v1/5/cart/apply_coupon",
      {
        params: { coupon_code: coupon, cart_id: cartId },
        headers: {
          authtoken: authToken,
          userid: userId,
          pin: pin,
          Accept: "application/json, text/plain, */*"
        },
        timeout: 10000
      }
    );

    if (res.data?.status === "success") {
      return { status: "success", coupon, result: res.data };
    } else {
      return { status: "error", coupon, error: res.data?.message || "Invalid coupon" };
    }
  } catch (err) {
    return { status: "error", coupon, error: err.response?.data || err.message };
  }
}

module.exports = { checkCoupon };
