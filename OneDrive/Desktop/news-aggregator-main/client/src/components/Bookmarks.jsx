import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch bookmarks from API
    // const fetchBookmarks = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await apiFetch('/bookmarks');
    //     setBookmarks(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch bookmarks:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchBookmarks();
  }, []);

  function handleRemoveBookmark(id) {
    setBookmarks(bookmarks.filter(b => b.id !== id));
    // Call API to remove bookmark
    // await apiFetch(`/bookmarks/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)] pt-24 pb-12 px-4">
      <div className="w-full">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-2xl font-bold hover:opacity-70 transition"
          >
            ←
          </button>
          <h1 className="text-4xl font-bold">My Bookmarks</h1>
          <span className="ml-auto text-sm opacity-70 bg-[var(--accent-purple)] rounded-full px-3 py-1">
            {bookmarks.length} bookmarks
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg opacity-70">Loading bookmarks...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg opacity-70 mb-4">No bookmarks yet</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-lg bg-[var(--accent-cyan)] text-[var(--primary)] font-medium hover:opacity-90 transition"
            >
              Browse News
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-[color-mix(in_srgb,var(--card-bg)_88%,transparent)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition"
              >
                {bookmark.image && (
                  <img
                    src={bookmark.image}
                    alt={bookmark.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{bookmark.title}</h3>
                  <p className="text-sm opacity-70 mb-3 line-clamp-2">{bookmark.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent-cyan)] text-[var(--primary)] text-sm font-medium hover:opacity-90 transition text-center"
                    >
                      Read Article
                    </a>
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.id)}
                      className="px-3 py-2 rounded-lg text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:bg-opacity-10 transition"
                      aria-label="Remove bookmark"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookmarks;
