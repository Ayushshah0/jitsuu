import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { newsService } from '../services/newsService';
import ErrorMessage from './ErrorMessage';
import SkeletonCard from './SkeletonCard';
import './News.css';

function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  useEffect(() => {
    fetchNews();
  }, [page, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setHasError(false);
    try {
      const response = await newsService.getAllNews(20, page, query);
      if (response.data.success) {
        setArticles(response.data.data.articles || []);
      } else {
        setHasError(true);
        setError(response.data.message || 'Unable to load news articles.');
      }
    } catch (err) {
      setHasError(true);
      setError('Failed to fetch news articles. Please try again.');
      console.error('News fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-page">
      <h2 className="page-title">All News</h2>

      {hasError && <ErrorMessage message={error} />}

      <div className="articles-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))
          : articles.map((article, index) => (
              <article key={index} className="article-card">
                {article.urlToImage && (
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
                <div className="article-content">
                  <h3>{article.title}</h3>
                  <p className="description">{article.description}</p>
                  <div className="article-footer">
                    <small className="source">
                      {article.source?.name || 'Unknown Source'}
                    </small>
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
              </article>
            ))}
      </div>

      <div className="pagination">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={loading || articles.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default News;
