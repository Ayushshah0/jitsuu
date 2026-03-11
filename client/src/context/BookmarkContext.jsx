import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { newsService } from '../services/newsService';
import AuthContext from './AuthContext';

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setBookmarks([]);
      return;
    }

    setLoading(true);
    newsService
      .getBookmarks()
      .then((response) => {
        setBookmarks(response.data.data || []);
      })
      .catch(() => {
        setBookmarks([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, authLoading]);

  const bookmarkedUrls = useMemo(() => new Set(bookmarks.map((bookmark) => bookmark.url)), [bookmarks]);

  const isBookmarked = (url) => bookmarkedUrls.has(url);

  const addBookmark = async (article) => {
    if (!user) {
      const error = new Error('AUTH_REQUIRED');
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    const response = await newsService.addBookmark(article);
    setBookmarks(response.data.data || []);
  };

  const removeBookmark = async (url) => {
    if (!user) {
      const error = new Error('AUTH_REQUIRED');
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    const response = await newsService.removeBookmark(url);
    setBookmarks(response.data.data || []);
  };

  const toggleBookmark = async (article) => {
    if (isBookmarked(article.url)) {
      await removeBookmark(article.url);
      return false;
    }

    await addBookmark(article);
    return true;
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, loading, isBookmarked, addBookmark, removeBookmark, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export default BookmarkContext;
