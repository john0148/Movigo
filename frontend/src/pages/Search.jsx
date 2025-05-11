// import { useSearchParams } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import { searchMovies } from '../api/movieApi';

// export default function Search() {
//   const [searchParams] = useSearchParams();
//   const query = searchParams.get('query') || '';
//   const genre = searchParams.get('category') || null;
//   const year = searchParams.get('year') || null;

//   const [results, setResults] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const data = await searchMovies(query, genre, year, 1, 20);
//       setResults(data);
//     };
//     if (query || genre || year) {
//       fetchData();
//     }
//   }, [query, genre, year]);

//   return (
//     <div>
//       <h2>Kết quả tìm kiếm</h2>
//       {results.length > 0 ? (
//         results.map(movie => (
//           <div key={movie.id}>{movie.title}</div>
//         ))
//       ) : (
//         <p>Không có kết quả tìm kiếm.</p>
//       )}
//     </div>
//   );
// }

import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { searchMovies } from '../api/movieApi';
import MovieItem from '../components/MovieItem'; 

export default function SearchPage() {
  const location = useLocation();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    const genre = queryParams.get('category') || null;
    const year = queryParams.get('year') || null;

    const fetchData = async () => {
      const data = await searchMovies(query, genre, year, 1, 20);
      setResults(data.results || []);
    };

    if (query || genre || year) {
      fetchData();
    }
  }, [location.search]); // 👈 Bắt thay đổi query string

  // return (
  //   <div>
  //     <h2>Kết quả tìm kiếm</h2>
  //     {results.length > 0 ? (
  //       results.map(movie => (
  //         <div key={movie.id}>{movie.title}</div>
  //       ))
  //     ) : (
  //       <p>Không tìm thấy kết quả.</p>
  //     )}
  //   </div>
  // );
  return (
    <div>
      <h2>Kết quả tìm kiếm</h2>
      {results.length > 0 ? (
        <div className="search-results">
          {results.map(movie => (
            <MovieItem
              key={movie.id}
              movie={movie}
              displayMode="list"      // hiển thị theo dạng danh sách dọc
              showDetails={true}      // luôn hiển thị thông tin phim
              onMovieClick={(id) => {
                // Xử lý khi click vào phim, ví dụ điều hướng đến trang chi tiết
                console.log("Click phim ID:", id);
                // Ví dụ nếu dùng react-router: navigate(`/movies/${id}`)
              }}
            />
          ))}
        </div>
      ) : (
        <p>Không tìm thấy kết quả.</p>
      )}
    </div>
  );

}
