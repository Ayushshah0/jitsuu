import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookmarkContext from '../context/BookmarkContext';
import { newsService } from '../services/newsService';

function ArticleCard({ article }) {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useContext(BookmarkContext);
  const [busy, setBusy] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const saved = isBookmarked(article.url);

  const handleBookmarkClick = async () => {
    try {
      setBusy(true);
      await toggleBookmark(article);
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        navigate('/login');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSummarizeClick = async () => {
    if (summaryData) {
      setSummaryOpen((open) => !open);
      return;
    }

    try {
      setSummaryLoading(true);
      setSummaryError('');
      const response = await newsService.summarizeArticle(article);
      setSummaryData(response.data.data);
      setSummaryOpen(true);
    } catch (error) {
      setSummaryError(
        error.response?.data?.message || 'Unable to generate a summary for this article right now.'
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <article className="article-card">
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          onError={(event) => {
            event.target.style.display = 'none';
          }}
        />
      )}
      <div className="article-content">
        <div className="article-actions">
          <button
            type="button"
            className={`summary-btn ${summaryOpen ? 'active' : ''}`}
            onClick={handleSummarizeClick}
            disabled={summaryLoading}
          >
            {summaryLoading ? 'Summarizing...' : summaryData && summaryOpen ? 'Hide Summary' : 'Summarize'}
          </button>
          <button
            type="button"
            className={`bookmark-btn ${saved ? 'saved' : ''}`}
            onClick={handleBookmarkClick}
            disabled={busy}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <h3>{article.title}</h3>
        <p className="description">{article.description}</p>
        {summaryError && <p className="summary-error">{summaryError}</p>}
        {summaryOpen && summaryData && (
          <div className="summary-panel">
            <p className="summary-copy">{summaryData.summary}</p>
            {summaryData.keyPoints?.length > 0 && (
              <ul className="summary-points">
                {summaryData.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
            <p className="summary-why">{summaryData.whyItMatters}</p>
            <small className="summary-meta">
              {summaryData.meta?.contentLimited
                ? 'Summary generated from limited article text.'
                : 'Summary generated from article excerpt.'}
            </small>
          </div>
        )}
        <div className="article-footer">
          <small className="source">{article.source?.name || article.sourceName || 'Unknown Source'}</small>
          <div className="article-footer-actions">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="read-more"
            >
              Read More →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
