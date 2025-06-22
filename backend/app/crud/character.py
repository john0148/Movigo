import logging
from ..schemas.character import CharacterInDB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CharacterCRUD:
    def __init__(self, database):
        self.collection = database.character

    async def get_by_movie_id(self, movie_id: str):
        logger.info(f"Getting characters for movie_id={movie_id}")
        cursor = self.collection.find({"movie_id": movie_id})
        characters = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            characters.append(CharacterInDB(**doc))
        return characters
