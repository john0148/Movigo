import { useEffect, useState } from "react";
import { getCharactersByMovieId } from "../../api/movieApi";
import { Users } from "lucide-react";
import "../../styles/MovieDetail.css"; 
import { baseImageUrl } from '../../config/constants';

export function MovieCharacters({ movieId }) {
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const data = await getCharactersByMovieId(movieId);
        // console.log("🎭 API /movies/{movie_id}/characters trả về:", data);
        setCharacters(data);
      } catch (err) {
        console.error("Error fetching characters:", err);
      }
    };

    fetchCharacters();
  }, [movieId]);

  return (
    <div className="cast-container">
      {characters.length > 0 ? (
        characters.map((char) => (
        //   <div key={char.id} className="cast-card">
        //     <div className="cast-photo">
        //       {char.image ? (
        //         <img src={char.image} alt={char.name} />
        //       ) : (
        //         <Users size={40} />
        //       )}
        //     </div>
        //     <h3 className="cast-name">{char.name}</h3>
        //     <p className="cast-role">{char.char} ({char.role})</p>
        //   </div>

          <div key={char._id} className="cast-card">
              <div className="cast-photo">
                  {char.image ? (
                  <img src={`${baseImageUrl}${char.image}`} alt={char.name} />
                  ) : (
                  <Users size={40} />
                  )}
              </div>
              <h3 className="cast-name">{char.name}</h3>
              <p className="cast-character">{char.char}</p>
              <p className="cast-role">{char.role}</p>
          </div>

        ))
      ) : (
        <p>Chưa có thông tin diễn viên.</p>
      )}
    </div>
  );
}
