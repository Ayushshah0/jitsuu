import { useState, useEffect } from 'react';
import { newsService } from '../services/newsService';
import ErrorMessage from './ErrorMessage';
import SkeletonCard from './SkeletonCard';
import './News.css';

function TopHeadlines() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [category, setCategory] = useState('business');
  const [page, setPage] = useState(1);

  const categories = [
    'business', 'entertainment', 'general', 
    'health', 'science', 'sports', 'technology'
  ];

  useEffect(() => {
    fetchNews();
  }, [category, page]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setHasError(false);
    try {
      const response = await newsService.getTopHeadlines(category, 20, page);
      if (response.data.success) {
        setArticles(response.data.data.articles || []);
      } else {
        setHasError(true);
        setError(response.data.message || 'Unable to load top headlines.');
      }
    } catch (err) {
      setHasError(true);
      setError('Failed to fetch top headlines. Please try again.');
      console.error('Top headlines fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-page">
      <h2 className="page-title">Top Headlines</h2>
      
      <div className="category-selector">
        <label>Category: </label>
        <select value={category} onChange={(e) => {
          setCategory(e.target.value);
          setPage(1);
        }}>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

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

export default TopHeadlines;
