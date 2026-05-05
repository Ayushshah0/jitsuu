const test = require("node:test");
const assert = require("node:assert/strict");
const { handleDialogflowWebhook } = require("../services/chatbotService");
const { recommendArticles } = require("../services/recommendationEngine");

test("Dialogflow fallback intent returns clarifying guidance", async () => {
  const response = await handleDialogflowWebhook({
    body: {
      queryResult: {
        intent: { displayName: "FallbackIntent" },
      },
    },
  });

  assert.equal(typeof response.fulfillmentText, "string");
  assert.match(response.fulfillmentText, /didn't understand/i);
});

test("Recommendation engine ranks articles by interest overlap", () => {
  const articles = [
    { title: "AI startup raises funding", description: "A new AI company launched", url: "https://a.example", source: { name: "Tech Daily" } },
    { title: "Sports update", description: "A football match recap", url: "https://b.example", source: { name: "Sports News" } },
  ];

  const ranked = recommendArticles(articles, { topics: ["ai", "startup"], sources: ["tech daily"] }, []);

  assert.equal(ranked[0].title, "AI startup raises funding");
  assert.equal(ranked.length, 1);
});