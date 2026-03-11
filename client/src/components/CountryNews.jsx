import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { newsService } from '../services/newsService';
import NotificationContext from '../context/NotificationContext';
import ArticleCard from './ArticleCard';
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

const categories = [
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'science', label: 'Science' },
  { value: 'sports', label: 'Sports' },
];

function CountryNews() {
  const { iso } = useParams();
  const { trackSearchTerm } = useContext(NotificationContext);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('general');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchNews();
  }, [iso, page, category, query]);

  useEffect(() => {
    setArticles([]); // Clear articles when country or category changes
    setPage(1);
    setQuery('');
    setSearchInput('');
  }, [iso]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setHasError(false);
    try {
      const countryCode = (iso || '').toLowerCase();
      const response = await newsService.getNewsByCountry(countryCode, category, 20, page, query);
      if (response.data.success) {
        setArticles(prev => page === 1 ? response.data.data.articles : [...prev, ...response.data.data.articles] || []);
      } else {
        setHasError(true);
        setArticles([]);
        setError(response.data.message || 'Unable to load country news.');
      }
    } catch (err) {
      setHasError(true);
      setArticles([]);
      setError(
        err.response?.data?.message || 'Failed to fetch news for this country. Please try again.'
      );
      console.error('Country news fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
    trackSearchTerm(searchInput);
  };

  const countryName = countryNames[(iso || '').toLowerCase()] || (iso || '').toUpperCase();

  return (
    <div className="news-page">
      <h2 className="page-title">
        News from {countryName} 🌍
      </h2>

      <div className="category-selector">
        <select 
          value={category} 
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
            setQuery('');
            setSearchInput('');
          }}
          className="category-select-dropdown"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="country-search-form">
          <input 
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search within this country..."
            className="country-search-input"
          />
          <button type="submit" className="country-search-button">Search</button>
        </form>
      </div>

      {hasError && <ErrorMessage message={error} />}

      <div className="articles-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))
          : articles.map((article, index) => (
              <ArticleCard key={article.url || index} article={article} />
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
