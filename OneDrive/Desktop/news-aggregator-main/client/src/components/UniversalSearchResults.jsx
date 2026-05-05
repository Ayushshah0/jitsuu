import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import countries from './countries';
import API_BASE_URL from '../config/api';

function UniversalSearchResults() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const q = (searchParams.get('q') || '').trim();

  const countryIso = (searchParams.get('country') || '').toLowerCase();
  const category = (searchParams.get('category') || '').toLowerCase();

  const countryName = useMemo(() => {
    if (!countryIso) {
      return '';
    }
    const match = countries.find((country) => country.iso_2_alpha === countryIso);
    return match?.countryName || '';
  }, [countryIso]);

  useEffect(() => {
    if (!q) {
      setData([]);
      return;
    }

    let isCancelled = false;


    async function fetchResults() {
      try {
        setIsLoading(true);
        setError(null);

        let url = '';
        // If country or category is selected, use /top-headlines or /country/:iso
        if (countryIso && category) {
          url = `${API_BASE_URL}/country/${countryIso}?category=${category}&page=1&pageSize=18`;
        } else if (countryIso) {
          url = `${API_BASE_URL}/country/${countryIso}?page=1&pageSize=18`;
        } else if (category) {
          url = `${API_BASE_URL}/top-headlines?category=${category}&page=1&pageSize=18`;
        } else if (q) {
          url = `${API_BASE_URL}/all-news?q=${encodeURIComponent(q)}&page=1&pageSize=18`;
        }

        if (!url) {
          setData([]);
          return;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const json = await response.json();
        if (!json.success) {
          throw new Error(json.message || 'Search request was not successful');
        }

        if (!isCancelled) {
          setData(json?.data?.articles || []);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          console.error('Search fetch error:', fetchError);
          setError('Unable to fetch search results right now. Please try again.');
          setData([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      isCancelled = true;
    };
  }, [q, countryName, countryIso, category]);

  if (!q) {
    return (
      <section className="px-4 md:px-16 py-10">
        <h2 className="text-2xl font-semibold mb-2">Search Results</h2>
        <p>Enter a query in the universal search bar to see results.</p>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-16 py-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-2">Results for "{q}"</h2>
      {countryName && <p className="mb-4">Country filter: {countryName}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="my-6 cards grid lg:place-content-center md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 xs:grid-cols-1 xs:gap-4 md:gap-10 lg:gap-14 xs:p-1">
        {!isLoading ? (
          data.length > 0 ? (
            data.map((element, index) => (
              <EverythingCard
                key={index}
                title={element.title}
                description={element.description}
                imgUrl={element.urlToImage}
                publishedAt={element.publishedAt}
                url={element.url}
                author={element.author}
                source={element.source.name}
              />
            ))
          ) : (
            <p>No results found for this query.</p>
          )
        ) : (
          <Loader />
        )}
      </div>
    </section>
  );
}

export default UniversalSearchResults;
