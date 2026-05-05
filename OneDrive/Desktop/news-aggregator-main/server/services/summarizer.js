function stripHtml(text) {
  return text.replace(/<[^>]*>/g, " ");
}

function stripUrls(text) {
  return text.replace(/https?:\/\/\S+/g, " ");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function cleanText(text = "") {
  if (!text || typeof text !== "string") {
    return "";
  }

  return normalizeWhitespace(stripUrls(stripHtml(text)));
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function sentenceScore(sentence) {
  const words = sentence.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
  return uniqueWords.size + Math.min(words.length, 25) / 10;
}

function summarizeArticle(article) {
  const cleanedTitle = cleanText(article.title || "");
  const cleanedDescription = cleanText(article.description || "");
  const cleanedContent = cleanText(article.content || "");

  const combined = [cleanedTitle, cleanedDescription, cleanedContent].filter(Boolean).join(". ");
  const sentences = splitSentences(combined);

  if (!sentences.length) {
    throw new Error("No summarizable content found");
  }

  const summarySentences = sentences.slice(0, Math.min(3, Math.max(2, sentences.length >= 2 ? 2 : 1)));
  const scored = [...sentences]
    .map((sentence) => ({ sentence, score: sentenceScore(sentence) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.sentence);

  const topicAnchor = cleanedTitle || scored[0] || "this update";
  const whyItMatters = `This matters because ${topicAnchor.charAt(0).toLowerCase()}${topicAnchor.slice(1)} may impact readers, markets, or policy decisions.`;

  const hasLimitedContent = /\[\+\d+ chars\]/i.test(article.content || "");

  return {
    summary: summarySentences.join(" "),
    keyPoints: scored,
    whyItMatters,
    method: "rule-based-v1",
    meta: {
      sourceName: article.source?.name || article.sourceName || "Unknown",
      publishedAt: article.publishedAt || null,
      contentLimited: hasLimitedContent,
    },
  };
}

module.exports = {
  cleanText,
  splitSentences,
  summarizeArticle,
};
