const axios = require("axios");

async function checkCoupon({ coupon, cartId, authToken, userId, pin }) {
  try {
    const response = await axios.get(
      "https://www.jiomart.com/mst/rest/v1/5/cart/apply_coupon",
      {
        params: { coupon_code: coupon, cart_id: cartId },
        headers: {
          authtoken: authToken,
          userid: userId,
          pin: pin,
          Accept: "application/json, text/plain, */*"
        }
      }
    );

    return { coupon, status: "success", data: response.data };
  } catch (err) {
    return {
      coupon,
      status: "error",
      error: err.response?.data || err.message
    };
  }
}

module.exports = { checkCoupon };
