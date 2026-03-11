function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[\+\d+\s*chars\]/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);
}

function uniqueSentences(sentences) {
  const seen = new Set();

  return sentences.filter((sentence) => {
    const normalized = sentence.toLowerCase();

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function buildFallbackSummary(article) {
  const title = cleanText(article.title);
  const description = cleanText(article.description);
  const sourceName = cleanText(article.source?.name || article.sourceName || 'the source');

  if (description) {
    return `${title || 'This story'} highlights ${description.charAt(0).toLowerCase()}${description.slice(1)}`;
  }

  if (title) {
    return `${title} was reported by ${sourceName}.`;
  }

  return `This article was reported by ${sourceName}, but only a limited excerpt is available.`;
}

function summarizeArticle(article = {}) {
  const title = cleanText(article.title);
  const description = cleanText(article.description);
  const content = cleanText(article.content);
  const sourceName = cleanText(article.source?.name || article.sourceName || 'Unknown Source');
  const publishedAt = cleanText(article.publishedAt);

  const sentences = uniqueSentences([
    ...splitSentences(description),
    ...splitSentences(content),
  ]);

  const summaryParts = [];

  if (title) {
    summaryParts.push(title.endsWith('.') ? title : `${title}.`);
  }

  if (sentences.length > 0) {
    summaryParts.push(sentences[0]);
  } else if (description) {
    summaryParts.push(description.endsWith('.') ? description : `${description}.`);
  }

  if (sentences.length > 1) {
    summaryParts.push(sentences[1]);
  }

  const combinedSummary = summaryParts.join(' ').trim();
  const summary = combinedSummary || buildFallbackSummary(article);

  const keyPoints = uniqueSentences([description, content, title])
    .filter(Boolean)
    .slice(0, 3)
    .map((point) => (point.endsWith('.') ? point : `${point}.`));

  return {
    summary,
    keyPoints,
    whyItMatters: `Why it matters: ${keyPoints[0] || summary}`,
    method: 'rule-based',
    meta: {
      sourceName,
      publishedAt: publishedAt || null,
      contentLimited: !content || /\[\+\d+\s*chars\]/i.test(String(article.content || '')),
    },
  };
}

module.exports = {
  summarizeArticle,
};