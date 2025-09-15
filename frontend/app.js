const resultsDiv = document.getElementById("results");
const form = document.getElementById("checkerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Build payload
  const payload = {
    userId: document.getElementById("userId").value,
    cartId: document.getElementById("cartId").value,
    authToken: document.getElementById("authToken").value,
    pin: document.getElementById("pin").value,
    prefix: document.getElementById("prefix").value || "T",
    count: parseInt(document.getElementById("count").value),
    concurrency: 2,
    retries: 2
  };

  // Start backend checking
  await fetch("http://127.0.0.1:5000/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // Open SSE for live updates
  const evtSource = new EventSource("http://127.0.0.1:5000/events");

  evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const div = document.createElement("div");

    if (data.status === "success") {
      div.className = "valid";
      div.textContent = `✅ ${data.coupon} → VALID`;
    } else {
      div.className = "error";
      div.textContent = `❌ ${data.coupon} → ERROR: ${JSON.stringify(data.error)}`;
    }

    resultsDiv.prepend(div);
  };
});
