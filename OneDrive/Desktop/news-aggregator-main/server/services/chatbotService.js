const { cleanText } = require("./summarizer");
const { fetchTopHeadlines, extractArticleSummary } = require("./newsService");
const { recommendArticles } = require("./recommendationEngine");

function normalizeIntentName(req = {}) {
  return req.body?.queryResult?.intent?.displayName
    || req.body?.fulfillmentInfo?.tag
    || req.body?.intent
    || req.body?.intentName
    || "";
}

function extractParameters(req = {}) {
  return req.body?.queryResult?.parameters
    || req.body?.parameters
    || {};
}

function getSessionId(req = {}) {
  return req.body?.session || req.body?.sessionId || req.body?.conversationId || "anonymous-session";
}

function buildTextResponse(text, payload = {}) {
  return {
    fulfillmentText: text,
    payload: {
      richContent: [[{
        type: "info",
        title: payload.title || "News Chatbot",
        subtitle: payload.subtitle || text,
      }]],
    },
    outputContexts: payload.outputContexts || [],
  };
}

function buildNewsBullets(articles = []) {
  return articles.slice(0, 3).map((article) => {
    const summary = extractArticleSummary(article);
    return `• ${summary.title} - ${summary.sourceName}${summary.publishedAt ? ` (${new Date(summary.publishedAt).toLocaleString()})` : ""}`;
  });
}

async function handleSummarizeNews(params = {}) {
  const topic = cleanText(params.topic || params.category || params.query || "news");
  const newsResult = await fetchTopHeadlines({ topic, category: params.category, location: params.location, pageSize: 5 });

  if (!newsResult.success) {
    return buildTextResponse(`I couldn't fetch live news for ${topic}. Here's the latest cached information if available.`);
  }

  const articles = newsResult.data?.articles || [];
  const bullets = buildNewsBullets(articles);
  const article = articles[0] || {};
  const summaryText = [
    `Here are the latest updates on ${topic}:`,
    ...bullets,
    article.url ? `Read more: ${article.url}` : null,
  ].filter(Boolean).join("\n");

  return buildTextResponse(summaryText, {
    title: `Latest on ${topic}`,
    subtitle: article.description || "Top headlines summarized",
  });
}

async function handleExplainNews(params = {}, sessionId = "anonymous-session") {
  const topic = cleanText(params.topic || params.query || params.category || "this story");
  const newsResult = await fetchTopHeadlines({ topic, category: params.category, location: params.location, pageSize: 3 });

  if (!newsResult.success) {
    return buildTextResponse(`I couldn't retrieve details for ${topic} right now. Try asking again in a moment.`);
  }

  const article = newsResult.data?.articles?.[0] || {};
  const explanation = [
    `ELI5: ${topic} is about ${article.description || "an evolving news story"}.`,
    article.content ? `Key detail: ${cleanText(article.content).slice(0, 300)}.` : null,
    `Session: ${sessionId}`,
  ].filter(Boolean).join("\n");

  return buildTextResponse(explanation, {
    title: `Explanation for ${topic}`,
    subtitle: article.title || "Story context",
  });
}

async function handleRecommendNews(params = {}, userProfile = {}) {
  const newsResult = await fetchTopHeadlines({
    topic: params.topic || "news",
    category: params.category || "general",
    location: params.location || userProfile.country || "us",
    pageSize: 20,
  });

  if (!newsResult.success) {
    return buildTextResponse("I couldn't generate recommendations right now. Please try again later.");
  }

  const recommendations = recommendArticles(
    newsResult.data?.articles || [],
    {
      topics: userProfile.topics || params.topics || [],
      categories: userProfile.categories || params.categories || [],
      sources: userProfile.sources || params.sources || [],
    },
    userProfile.readingHistory || []
  );

  const lines = recommendations.length
    ? recommendations.map((article) => `• ${article.title} (${article.source?.name || "Unknown"})`)
    : ["• No strong matches yet. Update your preferences to improve recommendations."];

  return buildTextResponse(["Here are news recommendations tailored to you:", ...lines].join("\n"), {
    title: "Recommended for you",
  });
}

function handleSetPreferences(params = {}) {
  const preferences = {
    topics: Array.isArray(params.topics) ? params.topics : params.topic ? [params.topic] : [],
    sources: Array.isArray(params.sources) ? params.sources : [],
    categories: Array.isArray(params.categories) ? params.categories : params.category ? [params.category] : [],
    language: params.language || "en",
    country: params.location || params.country || "us",
  };

  return buildTextResponse("Your preferences have been updated.", {
    title: "Preferences saved",
    subtitle: JSON.stringify(preferences),
  });
}

async function handleDialogflowWebhook(req) {
  const intentName = normalizeIntentName(req);
  const params = extractParameters(req);
  const sessionId = getSessionId(req);

  switch (intentName) {
    case "GetTopHeadlines":
      return handleSummarizeNews(params);
    case "SummarizeNews":
      return handleSummarizeNews(params);
    case "ExplainNews":
      return handleExplainNews(params, sessionId);
    case "RecommendNews":
      return handleRecommendNews(params, req.body?.userProfile || {});
    case "SetPreferences":
      return handleSetPreferences(params);
    case "Default Fallback Intent":
    case "FallbackIntent":
    default:
      return buildTextResponse(
        "I didn't understand that. Try asking for top headlines, a summary, an explanation, or recommendations.",
        { title: "Need a clearer prompt" }
      );
  }
}

module.exports = {
  handleDialogflowWebhook,
  handleSummarizeNews,
  handleExplainNews,
  handleRecommendNews,
  handleSetPreferences,
};