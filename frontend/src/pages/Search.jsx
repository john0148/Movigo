import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const useQueryParams = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};

export default function SearchPage() {
  const queryParams = useQueryParams();
  const query = queryParams.get('query') || '';
  const genre = queryParams.get('category') || null;
  const year = queryParams.get('year') || null;

  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await searchMovies(query, genre, year, 1, 20);
      setResults(data);
    };
    if (query || genre || year) {
      fetchData();
    }
  }, [query, genre, year]);

  return (
    <div>
      <h2>Kết quả tìm kiếm</h2>
      {results.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
}
