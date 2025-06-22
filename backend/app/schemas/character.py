from pydantic import BaseModel
from typing import Optional

class CharacterInDB(BaseModel):
    id: str
    movie_id: str
    role: str
    name: str
    char: str
    image: Optional[str] = None
