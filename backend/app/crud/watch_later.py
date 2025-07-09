"""
Watch later CRUD operations for the FastAPI application.
Handles all database operations for user watch later list including:
- Adding and removing movies from watch later
- Retrieving user watch later list
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from ..schemas.profile import WatchLaterEntry

logger = logging.getLogger(__name__)

class WatchLaterCRUD:
    """CRUD class for watch later operations"""
    
    def __init__(self, database):
        """
        Initialize WatchLaterCRUD with MongoDB database connection.
        
        Args:
            database: MongoDB database connection
        """
        self.db = database
        self.collection = database.watch_later
    
    async def create(self, obj_in: Dict[str, Any]) -> WatchLaterEntry:
        """
        Add a movie to watch later list.
        
        Args:
            obj_in: Watch later data to create
            
        Returns:
            Created watch later entry
        """
        now = datetime.utcnow()
        entry_data = dict(obj_in)
        
        # Transform schema format to database format
        db_entry = {
            "user_id": entry_data.get("user_id"),
            "movie_id": entry_data.get("movie_id"),  # Keep as string, will be converted if needed
            "added_date": entry_data.get("added_at", now),
            "movie": entry_data.get("movie_details", {}),
            "created_at": now,
            "updated_at": now
        }
        
        # Try to convert movie_id to ObjectId if it's a valid ObjectId string
        try:
            if isinstance(db_entry["movie_id"], str) and len(db_entry["movie_id"]) == 24:
                db_entry["movie_id"] = ObjectId(db_entry["movie_id"])
        except:
            pass  # Keep as string if conversion fails
        
        result = await self.collection.insert_one(db_entry)
        
        # Return in schema format
        return WatchLaterEntry(
            id=str(result.inserted_id),
            user_id=entry_data.get("user_id", ""),
            movie_id=str(entry_data.get("movie_id", "")),
            added_at=entry_data.get("added_at", now),
            movie_details=entry_data.get("movie_details", {})
        )
    
    async def get(self, entry_id: str) -> Optional[WatchLaterEntry]:
        """
        Get a watch later entry by ID.
        
        Args:
            entry_id: Watch later entry ID (can be ObjectId or UUID)
            
        Returns:
            Watch later entry if found, None otherwise
        """
        entry = None
        
        # Try to find by ObjectId first
        try:
            entry = await self.collection.find_one({"_id": ObjectId(entry_id)})
        except InvalidId:
            # If not a valid ObjectId, try finding by UUID
            entry = await self.collection.find_one({"_id": entry_id})
        
        if not entry:
            return None
        
        # Transform database format to schema format
        entry_id = str(entry.pop("_id"))
        movie_id = str(entry.get("movie_id", ""))
        
        transformed_entry = {
            "id": entry_id,
            "user_id": entry.get("user_id", ""),
            "movie_id": movie_id,
            "added_at": entry.get("added_date", datetime.utcnow()),
            "movie_details": entry.get("movie", {})
        }
        
        return WatchLaterEntry(**transformed_entry)
    
    async def get_by_user_and_movie(self, user_id: str, movie_id: str) -> Optional[WatchLaterEntry]:
        """
        Get a watch later entry by user ID and movie ID.
        
        Args:
            user_id: User ID
            movie_id: Movie ID
            
        Returns:
            Watch later entry if found, None otherwise
        """
        # Try to convert movie_id to ObjectId for database query
        try:
            query_movie_id = ObjectId(movie_id)
        except InvalidId:
            query_movie_id = movie_id
        
        entry = await self.collection.find_one({
            "user_id": user_id,
            "movie_id": query_movie_id
        })
        
        if not entry:
            return None
        
        # Transform database format to schema format
        entry_id = str(entry.pop("_id"))
        movie_id = str(entry.get("movie_id", ""))
        
        transformed_entry = {
            "id": entry_id,
            "user_id": entry.get("user_id", ""),
            "movie_id": movie_id,
            "added_at": entry.get("added_date", datetime.utcnow()),
            "movie_details": entry.get("movie", {})
        }
        
        return WatchLaterEntry(**transformed_entry)
    
    async def get_user_list(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[WatchLaterEntry]:
        """
        Get a user's watch later list with pagination.
        
        Args:
            user_id: User ID
            skip: Number of entries to skip
            limit: Maximum number of entries to return
            
        Returns:
            List of watch later entries for the user
        """
        cursor = self.collection.find({"user_id": user_id})\
            .sort("added_date", -1)\
            .skip(skip)\
            .limit(limit)
        
        entries = []
        async for entry in cursor:
            # Transform database format to schema format
            entry_id = str(entry.pop("_id"))
            movie_id = str(entry.get("movie_id", ""))
            
            transformed_entry = {
                "id": entry_id,
                "user_id": entry.get("user_id", ""),
                "movie_id": movie_id,
                "added_at": entry.get("added_date", datetime.utcnow()),
                "movie_details": entry.get("movie", {})
            }
            
            entries.append(WatchLaterEntry(**transformed_entry))
        
        return entries
    
    async def count_user_list(self, user_id: str) -> int:
        """
        Count the number of watch later entries for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Count of watch later entries
        """
        return await self.collection.count_documents({"user_id": user_id})
    
    async def delete(self, entry_id: str) -> bool:
        """
        Delete a watch later entry by ID.
        
        Args:
            entry_id: Watch later entry ID (can be ObjectId or UUID)
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            # Try to delete by ObjectId
            result = await self.collection.delete_one({"_id": ObjectId(entry_id)})
        except InvalidId:
            # If not a valid ObjectId, delete by UUID
            result = await self.collection.delete_one({"_id": entry_id})
        
        return result.deleted_count > 0 