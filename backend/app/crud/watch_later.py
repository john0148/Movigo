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
        
        # Set default values
        entry_data.update({
            "added_at": entry_data.get("added_at", now),
            "created_at": now,
            "updated_at": now
        })
        
        result = await self.collection.insert_one(entry_data)
        entry_data["id"] = str(result.inserted_id)
        
        return WatchLaterEntry(**entry_data)
    
    async def get(self, entry_id: str) -> Optional[WatchLaterEntry]:
        """
        Get a watch later entry by ID.
        
        Args:
            entry_id: Watch later entry ID (can be ObjectId or UUID)
            
        Returns:
            Watch later entry if found, None otherwise
        """
        # Try to find by ObjectId first
        try:
            entry = await self.collection.find_one({"_id": ObjectId(entry_id)})
            if entry:
                entry["id"] = str(entry.pop("_id"))
                return WatchLaterEntry(**entry)
        except InvalidId:
            # If not a valid ObjectId, try finding by UUID
            entry = await self.collection.find_one({"_id": entry_id})
            if entry:
                entry["id"] = entry.pop("_id")
                return WatchLaterEntry(**entry)
        
        return None
    
    async def get_by_user_and_movie(self, user_id: str, movie_id: str) -> Optional[WatchLaterEntry]:
        """
        Get a watch later entry by user ID and movie ID.
        
        Args:
            user_id: User ID
            movie_id: Movie ID
            
        Returns:
            Watch later entry if found, None otherwise
        """
        entry = await self.collection.find_one({
            "user_id": user_id,
            "movie_id": movie_id
        })
        
        if not entry:
            return None
        
        entry["id"] = str(entry.pop("_id"))
        return WatchLaterEntry(**entry)
    
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
            .sort("added_at", -1)\
            .skip(skip)\
            .limit(limit)
        
        entries = []
        async for entry in cursor:
            entry["id"] = str(entry.pop("_id"))
            entries.append(WatchLaterEntry(**entry))
        
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