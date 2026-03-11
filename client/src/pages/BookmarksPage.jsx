import { useContext } from 'react';
import BookmarkContext from '../context/BookmarkContext';
import AuthContext from '../context/AuthContext';
import ArticleCard from '../components/ArticleCard';
import '../components/News.css';

function BookmarksPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { bookmarks, loading } = useContext(BookmarkContext);

  if (authLoading || loading) {
    return (
      <div className="news-page">
        <h2 className="page-title">My Bookmarks</h2>
        <p className="loading">Loading bookmarks...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="news-page">
        <h2 className="page-title">My Bookmarks</h2>
        <p className="error">Please log in to view your saved articles.</p>
      </div>
    );
  }

  return (
    <div className="news-page">
      <h2 className="page-title">My Bookmarks</h2>
      {bookmarks.length === 0 ? (
        <p className="loading">You have not saved any articles yet.</p>
      ) : (
        <div className="articles-grid">
          {bookmarks.map((article) => (
            <ArticleCard key={article.url} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;
