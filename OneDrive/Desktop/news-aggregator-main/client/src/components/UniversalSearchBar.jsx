import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function UniversalSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');


  function handleSubmit(event) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set('q', trimmedQuery);

    navigate(`/search?${params.toString()}`);
  }

  return (
    <section className="universal-search-wrap mt-24 md:mt-28 px-4 md:px-10 lg:px-16">
      <form className="universal-search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="universal-search-input"
          placeholder="Search global news, topics, people..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <button type="submit" className="btn universal-search-btn">Search</button>
      </form>
    </section>
  );
}

export default UniversalSearchBar;
