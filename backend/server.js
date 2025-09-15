// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { generateCoupons } = require("./generator");
const { processJob } = require("./queueManager");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;
const jobs = new Map(); // jobId => { status, clients: [], abort, ... }

app.post("/start", (req, res) => {
  try {
    const { prefix = "T", count = 100, cartId, authToken, userId, pin, concurrency = 3, retries = 2 } = req.body;

    // Basic validation
    if (!cartId || !authToken || !userId || !pin) {
      return res.status(400).json({ error: "cartId, authToken, userId and pin are required" });
    }
    // ensure count sanity
    const n = Math.min(Math.max(parseInt(count, 10) || 100, 1), 20000); // 1..20000

    // generate coupons and ensure length 11
    const coupons = generateCoupons(prefix || "T", n);

    const jobId = uuidv4();
    jobs.set(jobId, { status: "queued", createdAt: Date.now(), clients: [] });

    // Start job in background (don't block response)
    (async () => {
      try {
        jobs.get(jobId).status = "running";
        // progressCallback sends SSE messages to connected clients
        const progressCallback = (update) => {
          const job = jobs.get(jobId);
          if (!job) return;
          job.last = update;
          // push to clients: SSE
          if (job.clients && job.clients.length > 0) {
            const payload = JSON.stringify(update);
            job.clients.forEach(res => {
              try {
                res.write(`data: ${payload}\n\n`);
              } catch (e) {
                // ignore broken client
              }
            });
          }
        };

        const resultSummary = await processJob({
          jobId,
          coupons,
          cartId,
          authToken,
          userId,
          pin,
          concurrency,
          retries,
          progressCallback
        });

        jobs.get(jobId).status = "finished";
        jobs.get(jobId).summary = resultSummary.counts;
        // send final event
        if (jobs.get(jobId).clients) {
          jobs.get(jobId).clients.forEach(res => {
            try {
              res.write(`event: done\ndata: ${JSON.stringify(resultSummary.counts)}\n\n`);
            } catch (e) {}
          });
        }
      } catch (err) {
        const job = jobs.get(jobId);
        if (job) job.status = "errored";
        console.error("Job error:", err);
      }
    })();

    return res.json({ jobId, status: "started" });
  } catch (err) {
    console.error("Start error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// SSE endpoint for live updates. Client connects and listens to streaming data
app.get("/events", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId || !jobs.has(jobId)) {
    return res.status(400).send("Missing or invalid jobId");
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  // Push this response into job clients
  const job = jobs.get(jobId);
  job.clients.push(res);

  // If there's a last update, send it immediately
  if (job.last) {
    res.write(`data: ${JSON.stringify(job.last)}\n\n`);
  }

  // on client close, remove from job clients
  req.on("close", () => {
    const idx = job.clients.indexOf(res);
    if (idx !== -1) job.clients.splice(idx, 1);
  });
});

// Stop a running job (best-effort)
app.post("/stop", (req, res) => {
  const { jobId } = req.body;
  if (!jobId || !jobs.has(jobId)) return res.status(400).json({ error: "Invalid jobId" });
  const job = jobs.get(jobId);
  job.status = "stopped";
  // we don't implement abort in queueManager in this simple version; job will finish current set
  return res.json({ jobId, status: "stopping" });
});

// Download endpoints: valid, invalid, errors, all
app.get("/download/:jobId/:type", (req, res) => {
  const { jobId, type } = req.params;
  const allowed = ["valid", "invalid", "errors", "all"];
  if (!jobs.has(jobId)) return res.status(404).send("Job not found");
  if (!allowed.includes(type)) return res.status(400).send("Invalid type");

  const fileMap = {
    valid: `${jobId}_valid.json`,
    invalid: `${jobId}_invalid.json`,
    errors: `${jobId}_errors.json`,
    all: `${jobId}_all.json`
  };

  const filePath = path.join(__dirname, "results", fileMap[type]);
  if (!fs.existsSync(filePath)) return res.status(404).send("No results yet");

  res.download(filePath, fileMap[type]);
});

app.get("/", (req, res) => res.send("JioMart Checker backend running. Use /start to create a job."));

app.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));
