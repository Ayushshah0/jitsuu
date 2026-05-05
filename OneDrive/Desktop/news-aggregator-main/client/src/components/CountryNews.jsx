
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import countries from './countries';
import API_BASE_URL from '../config/api';

function CountryNews() {
  const categories = ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'];
  const params = useParams();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('general');
  const iso = (params.iso || '').toLowerCase();
  const countryMeta = countries.find((country) => country.iso_2_alpha === iso);
  const countryName = countryMeta?.countryName || iso.toUpperCase();

  function handlePrev() {
    setPage(page - 1);
  }

  function handleNext() {
    setPage(page + 1);
  }

  const pageSize = 6;

  useEffect(() => {
    setPage(1);
    setSelectedCategory('general');
  }, [params.iso]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchCountryNews() {
      try {
        setIsLoading(true);
        setError(null);

        const countryResponse = await fetch(`${API_BASE_URL}/country/${iso}?category=${selectedCategory}&page=${page}&pageSize=${pageSize}`);
        if (!countryResponse.ok) {
          throw new Error('Country endpoint failed');
        }

        const countryJson = await countryResponse.json();
        if (!countryJson.success) {
          throw new Error(countryJson.message || 'Country request failed');
        }

        const countryArticles = countryJson?.data?.articles || [];
        if (!isCancelled) {
          setTotalResults(countryJson.data.totalResults || countryArticles.length);
          setData(countryArticles);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (!isCancelled) {
          setError('Failed to fetch country news. Please try again later.');
          setData([]);
          setTotalResults(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCountryNews();

    return () => {
      isCancelled = true;
    };
  }, [page, params.iso, selectedCategory, iso]);

  return (
    <>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <section className="country-filter-wrap mt-24 px-4 md:px-10 lg:px-16">
        <h2 className="country-title text-2xl md:text-3xl font-bold mb-4">{countryName} News</h2>
        <div className="country-category-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? 'country-category-chip active' : 'country-category-chip'}
              onClick={() => {
                setSelectedCategory(category);
                setPage(1);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="my-10 cards grid lg:place-content-center md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 xs:grid-cols-1 xs:gap-4 md:gap-10 lg:gap-14 md:px-16 xs:p-3">
        {!isLoading ? (
          data.length > 0 ? (
            data.map((element, index) => (
              <EverythingCard
                key={index}
                title={element.title}
                description={element.description}
                content={element.content}
                imgUrl={element.urlToImage}
                publishedAt={element.publishedAt}
                url={element.url}
                author={element.author}
                source={element.source.name}
              />
            ))
          ) : (
            <p>No news articles found for this criteria.</p>
          )
        ) : (
          <Loader />
        )}
      </div>
      {!isLoading && data.length > 0 && (
        <div className="pagination flex justify-center gap-14 my-10 items-center">
          <button
            disabled={page <= 1}
            className="pagination-btn"
            onClick={handlePrev}
          >
            Prev
          </button>
          <p className="font-semibold opacity-80">
            {page} of {Math.ceil(totalResults / pageSize)}
          </p>
          <button
            disabled={page >= Math.ceil(totalResults / pageSize)}
            className="pagination-btn"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

export default CountryNews;
