// checker.js
// Uses your provided jiomart request pattern (axios GET to apply_coupon).
// Returns { coupon, status: "Valid"|"Invalid"|"Error", reason?, raw? }

const axios = require("axios");

async function checkCouponWithApi(coupon, cartId, authToken, userId, pin, timeout = 10000) {
  if (!coupon || !cartId || !authToken || !userId || !pin) {
    return { coupon, status: "Error", reason: "Missing required auth/cart fields" };
  }

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
        },
        timeout
      }
    );

    // response.data structure depends on jiomart; inspect and map carefully
    const data = response.data || {};

    // Example mapping: response.data.status could indicate success/failed
    // Adjust this mapping if your observed API returns different fields.
    const statusField = data.status?.toString().toLowerCase() || "";
    if (statusField.includes("success") || statusField.includes("valid") || data.applied === true) {
      return { coupon, status: "Valid", reason: data.message || "Applied", raw: data };
    } else {
      // Treat as invalid if API responded but no success
      return { coupon, status: "Invalid", reason: data.message || JSON.stringify(data), raw: data };
    }
  } catch (err) {
    // Provide helpful reason text (401, 429, network, etc)
    const code = err.response?.status;
    const body = err.response?.data;
    let reason = err.message;
    if (code) reason = `HTTP ${code} - ${JSON.stringify(body)}`;
    return { coupon, status: "Error", reason, raw: body || null };
  }
}

module.exports = { checkCouponWithApi };
