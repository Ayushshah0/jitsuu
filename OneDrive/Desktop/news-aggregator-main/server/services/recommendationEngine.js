function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function buildInterestSet(preferences = {}) {
  const topics = Array.isArray(preferences.topics) ? preferences.topics : [];
  const categories = Array.isArray(preferences.categories) ? preferences.categories : [];
  const sources = Array.isArray(preferences.sources) ? preferences.sources : [];

  return new Set([...topics, ...categories, ...sources].map(normalizeText).filter(Boolean));
}

function scoreArticle(article, interests, historySet) {
  const text = normalizeText([
    article.title,
    article.description,
    article.content,
    article.source?.name,
  ].filter(Boolean).join(" "));

  let score = 0;
  interests.forEach((interest) => {
    if (interest && text.includes(interest)) {
      score += 3;
    }
  });

  if (historySet.has(normalizeText(article.url))) {
    score -= 5;
  }

  if (article.source?.name) {
    const source = normalizeText(article.source.name);
    if (interests.has(source)) {
      score += 2;
    }
  }

  return score;
}

function recommendArticles(articles = [], preferences = {}, readingHistory = []) {
  const interests = buildInterestSet(preferences);
  const historySet = new Set((readingHistory || []).map((item) => normalizeText(item.url || item)));

  return [...articles]
    .map((article) => ({
      ...article,
      relevanceScore: scoreArticle(article, interests, historySet),
    }))
    .filter((article) => article.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
}

module.exports = {
  recommendArticles,
};