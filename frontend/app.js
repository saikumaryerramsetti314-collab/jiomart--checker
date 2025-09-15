const resultsDiv = document.getElementById("results");
const form = document.getElementById("checkerForm");
const downloadBtn = document.getElementById("downloadBtn");
let checkedCoupons = [];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultsDiv.innerHTML = "";
  checkedCoupons = [];

  const payload = {
    prefix: document.getElementById("prefix").value || "T",
    count: parseInt(document.getElementById("count").value),
    authToken: document.getElementById("authToken").value,
    pin: document.getElementById("pin").value,
    userId: document.getElementById("userId").value,
    cartId: document.getElementById("cartId").value,
    concurrency: 2
  };

  await fetch("http://127.0.0.1:5000/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const evtSource = new EventSource("http://127.0.0.1:5000/events");
  evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const div = document.createElement("div");
    if (data.status === "success") {
      div.className = "valid";
      div.textContent = `✅ ${data.coupon} → VALID`;
    } else {
      div.className = "error";
      div.textContent = `❌ ${data.coupon} → ERROR: ${data.error}`;
    }
    resultsDiv.prepend(div);
    checkedCoupons.push(data);
  };
});

downloadBtn.addEventListener("click", () => {
  if (checkedCoupons.length === 0) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(checkedCoupons, null, 2));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "checked_coupons.json");
  dlAnchor.click();
});
