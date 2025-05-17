# import httpx
# from typing import List
# from ..schemas.movie import MovieResponse

# TMDB_API_KEY = "12b062a4565a76aa9b24f20c65b03135"
# TMDB_BASE_URL = "https://api.themoviedb.org/3"

# async def fetch_popular_movies(page: int = 1) -> List[dict]:
#     async with httpx.AsyncClient() as client:
#         response = await client.get(
#             f"{TMDB_BASE_URL}/movie/popular",
#             params={"api_key": TMDB_API_KEY, "language": "en-US", "page": page},
#             timeout=10.0
#         )
#         response.raise_for_status()
#         data = response.json()
#         return data.get("results", [])


# services/tmdb_client.py
import httpx
from ..schemas.movie import TMDbMovie

TMDB_API_KEY = "12b062a4565a76aa9b24f20c65b03135"
BASE_URL = "https://api.themoviedb.org/3"

async def fetch_popular_movies(page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/movie/popular",
            params={"api_key": TMDB_API_KEY, "language": "en-US", "page": page},
        )
        response.raise_for_status()
        data = response.json()
        movies = data.get("results", [])
        
        # Convert TMDb movie format to your app's format
        return [
            TMDbMovie(
                id=str(movie["id"]),
                title=movie["title"],
                description=movie.get("overview", ""),
                poster_url=f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                duration_minutes=120,
                release_year=int(movie["release_date"].split("-")[0]) if movie.get("release_date") else None,
                genres=[],
                rating=movie.get("vote_average", 0.0),
            )
            for movie in movies
        ]
