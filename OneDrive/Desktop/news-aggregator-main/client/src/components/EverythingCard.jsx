import React, { useState } from "react";
import API_BASE_URL from "../config/api";

const SAVED_ARTICLES_KEY = "saved-articles-v1";

function getSavedArticles() {
  try {
    const raw = localStorage.getItem(SAVED_ARTICLES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSavedArticles(articles) {
  localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(articles));
}

function Card(props) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [isSaved, setIsSaved] = useState(() => getSavedArticles().some((item) => item.url === props.url));

  function handleSaveToggle() {
    const saved = getSavedArticles();

    if (isSaved) {
      const next = saved.filter((item) => item.url !== props.url);
      setSavedArticles(next);
      setIsSaved(false);
      return;
    }

    const article = {
      title: props.title,
      description: props.description,
      content: props.content,
      url: props.url,
      source: props.source || "Unknown",
      author: props.author,
      publishedAt: props.publishedAt,
      imgUrl: props.imgUrl,
      savedAt: new Date().toISOString(),
    };

    const alreadyExists = saved.some((item) => item.url === article.url);
    if (!alreadyExists) {
      setSavedArticles([article, ...saved]);
    }
    setIsSaved(true);
  }

  async function handleSummarizeToggle() {
    if (isSummaryOpen) {
      setIsSummaryOpen(false);
      return;
    }

    if (summaryData) {
      setIsSummaryOpen(true);
      return;
    }

    try {
      setIsSummarizing(true);
      setSummaryError("");

      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article: {
            title: props.title,
            description: props.description,
            content: props.content,
            url: props.url,
            source: { name: props.source || "Unknown" },
            publishedAt: props.publishedAt,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload?.error || "Unable to summarize this article.");
      }

      setSummaryData(payload.data);
      setIsSummaryOpen(true);
    } catch (error) {
      setSummaryError(error.message || "Failed to summarize. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  }

  const summarizeButtonLabel = isSummarizing
    ? "Summarizing..."
    : isSummaryOpen
    ? "Hide Summary"
    : "Summarize";

  return (
    <div className="everything-card">
      <div className="card-content flex flex-col p-5 gap-3 h-full">
        <b className="title">{props.title}</b>
        <div className="everything-card-img mx-auto">
          <img className="everything-card-img" src={props.imgUrl} alt="img" />
        </div>
        <div className="description">
          <p className="description-text leading-7">
            {props.description?.substring(0, 200)}
          </p>
        </div>
        <div className="info card-meta">
          <div className="source-info flex items-center gap-2">
            <span className="font-semibold">Source:</span>
            <a
              href={props.url}
              target="_blank"
              rel="noreferrer"
              className="link underline break-words"
            >
              {(props.source || "Unknown").substring(0, 70)}
            </a>
          </div>
          <div className="origin flex flex-col">
            <p className="origin-item">
              <span className="font-semibold">Author:</span>
              {props.author}
            </p>
            <p className="origin-item">
              <span className="font-semibold">Published At:</span>
              ({props.publishedAt})
            </p>
          </div>
        </div>
        <div className="card-actions mt-2 w-full flex items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary card-action-btn"
            onClick={handleSummarizeToggle}
            disabled={isSummarizing}
            aria-busy={isSummarizing}
          >
            {summarizeButtonLabel}
          </button>
          <button
            type="button"
            className={`btn btn-secondary card-action-btn ${isSaved ? "saved-active" : ""}`}
            onClick={handleSaveToggle}
            aria-pressed={isSaved}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {summaryError && <p className="mt-3 text-sm text-red-400">{summaryError}</p>}

        {isSummaryOpen && summaryData && (
          <section className="summary-panel mt-4 w-full rounded-xl border p-4">
            <p className="text-sm leading-6">{summaryData.summary}</p>
            <ul className="mt-3 list-disc pl-5 text-sm space-y-1">
              {(summaryData.keyPoints || []).slice(0, 3).map((point, index) => (
                <li key={`${index}-${point.slice(0, 18)}`}>{point}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <span className="font-semibold">Why it matters:</span> {summaryData.whyItMatters}
            </p>
            <p className="mt-2 text-xs opacity-80">
              {summaryData.meta?.sourceName || "Unknown source"}
              {summaryData.meta?.publishedAt ? ` | ${summaryData.meta.publishedAt}` : ""}
              {summaryData.meta?.contentLimited ? " | Limited article text used" : ""}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

export default Card;
