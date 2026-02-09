import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { newsService } from '../services/newsService';
import ErrorMessage from './ErrorMessage';
import SkeletonCard from './SkeletonCard';
import './News.css';

const countryNames = {
  us: 'United States',
  gb: 'United Kingdom',
  ca: 'Canada',
  au: 'Australia',
  in: 'India',
  de: 'Germany',
  fr: 'France',
  jp: 'Japan',
  np: 'Nepal'
};

function CountryNews() {
  const { iso } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNews();
  }, [iso, page]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setHasError(false);
    try {
      const countryCode = (iso || '').toLowerCase();
      const response = await newsService.getNewsByCountry(countryCode, 20, page);
      if (response.data.success) {
        setArticles(response.data.data.articles || []);
      } else {
        setHasError(true);
        setArticles([]);
        setError(response.data.message || 'Unable to load country news.');
      }
    } catch (err) {
      setHasError(true);
      setArticles([]);
      setError('Failed to fetch news for this country. Please try again.');
      console.error('Country news fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const countryName = countryNames[(iso || '').toLowerCase()] || (iso || '').toUpperCase();

  return (
    <div className="news-page">
      <h2 className="page-title">
        News from {countryName} 🌍
      </h2>

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

export default CountryNews;
