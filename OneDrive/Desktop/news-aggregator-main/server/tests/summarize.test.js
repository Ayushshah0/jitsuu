const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const summarizeRouter = require("../routes/summarize");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/summarize", summarizeRouter);
  return app;
}

test("POST /summarize returns structured summary for valid article", async () => {
  const app = createApp();

  const response = await request(app)
    .post("/summarize")
    .send({
      article: {
        title: "Markets rally after rate pause",
        description: "Stocks rose broadly after the central bank held rates steady.",
        content: "Analysts expect cautious optimism in the coming quarter.",
        url: "https://example.com/article/1",
        source: { name: "Example News" },
        publishedAt: "2026-04-14T10:00:00Z",
      },
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data.summary, "string");
  assert.ok(Array.isArray(response.body.data.keyPoints));
  assert.equal(typeof response.body.data.whyItMatters, "string");
  assert.equal(response.body.data.method, "rule-based-v1");
});

test("POST /summarize rejects empty article with 400", async () => {
  const app = createApp();

  const response = await request(app)
    .post("/summarize")
    .send({ article: {} });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("POST /summarize returns cache-hit message on repeated request", async () => {
  const app = createApp();
  const payload = {
    article: {
      title: "New renewable policy announced",
      description: "Government introduced incentives for clean energy projects.",
      content: "Industry groups welcomed the decision and expect faster investments.",
      url: "https://example.com/article/2",
      source: { name: "Policy Desk" },
      publishedAt: "2026-04-14T12:00:00Z",
    },
  };

  const first = await request(app).post("/summarize").send(payload);
  const second = await request(app).post("/summarize").send(payload);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.message, "Summary loaded from cache.");
});
