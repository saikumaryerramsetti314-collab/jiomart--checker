const PQueue = require("p-queue").default;

// Create queue with concurrency and optional delay
function createQueue(concurrency = 2, delayMs = 500) {
  return new PQueue({
    concurrency,
    interval: delayMs,
    intervalCap: 1
  });
}

module.exports = { createQueue };
