"""
Watch history CRUD operations for the FastAPI application.
Handles all database operations for user watch history including:
- Creating and updating watch history entries
- Retrieving user watch history
- Generating watch statistics
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId

from ..schemas.profile import WatchHistoryEntry

logger = logging.getLogger(__name__)

class WatchHistoryCRUD:
    """CRUD class for watch history operations"""
    
    def __init__(self, database):
        """
        Initialize WatchHistoryCRUD with MongoDB database connection.
        
        Args:
            database: MongoDB database connection
        """
        self.db = database
        self.collection = database.watch_history
    
    async def create(self, obj_in: Dict[str, Any]) -> WatchHistoryEntry:
        """
        Create a new watch history entry.
        
        Args:
            obj_in: Watch history data to create
            
        Returns:
            Created watch history entry
        """
        now = datetime.utcnow()
        entry_data = dict(obj_in)
        
        # Set default values
        entry_data.update({
            "watched_at": entry_data.get("watched_at", now),
            "watch_duration": entry_data.get("watch_duration", 0),
            "completed": entry_data.get("completed", False),
            "progress_percent": entry_data.get("progress_percent", 0.0),
            "created_at": now,
            "updated_at": now
        })
        
        result = await self.collection.insert_one(entry_data)
        entry_data["id"] = str(result.inserted_id)
        
        return WatchHistoryEntry(**entry_data)
    
    async def get(self, entry_id: str) -> Optional[WatchHistoryEntry]:
        """
        Get a watch history entry by ID.
        
        Args:
            entry_id: Watch history entry ID (can be ObjectId or UUID)
            
        Returns:
            Watch history entry if found, None otherwise
        """
        # Try to find by ObjectId first
        try:
            entry = await self.collection.find_one({"_id": ObjectId(entry_id)})
            if entry:
                entry["id"] = str(entry.pop("_id"))
                return WatchHistoryEntry(**entry)
        except InvalidId:
            # If not a valid ObjectId, try finding by UUID
            entry = await self.collection.find_one({"_id": entry_id})
            if entry:
                entry["id"] = entry.pop("_id")
                return WatchHistoryEntry(**entry)
        
        return None
    
    async def get_by_user_and_movie(self, user_id: str, movie_id: str) -> Optional[WatchHistoryEntry]:
        """
        Get a watch history entry by user ID and movie ID.
        
        Args:
            user_id: User ID
            movie_id: Movie ID
            
        Returns:
            Watch history entry if found, None otherwise
        """
        entry = await self.collection.find_one({
            "user_id": user_id,
            "movie_id": movie_id
        })
        
        if not entry:
            return None
        
        entry["id"] = str(entry.pop("_id"))
        return WatchHistoryEntry(**entry)
    
    async def get_user_history(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[WatchHistoryEntry]:
        """
        Get a user's watch history with pagination.
        
        Args:
            user_id: User ID
            skip: Number of entries to skip
            limit: Maximum number of entries to return
            
        Returns:
            List of watch history entries for the user
        """
        cursor = self.collection.find({"user_id": user_id})\
            .sort("watched_at", -1)\
            .skip(skip)\
            .limit(limit)
        
        entries = []
        async for entry in cursor:
            entry["_id"] = str(entry.pop("_id"))
            entry["movie_id"] = str(entry["movie_id"])
            
            entry["watch_duration"] = entry.get("watch_duration", 0)
            entry["progress_percent"] = entry.get("progress_percent", 0)
            entry["movie_details"] = entry.get("movie_details", {})
            
            entries.append(WatchHistoryEntry(**entry))
        
        return entries
    
    async def count_user_history(self, user_id: str) -> int:
        """
        Count the number of watch history entries for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Count of watch history entries
        """
        return await self.collection.count_documents({"user_id": user_id})
    
    async def update(self, entry_id: str, obj_in: Dict[str, Any]) -> Optional[WatchHistoryEntry]:
        """
        Update a watch history entry by ID.
        
        Args:
            entry_id: Watch history entry ID (can be ObjectId or UUID)
            obj_in: Watch history data to update
            
        Returns:
            Updated watch history entry if found, None otherwise
        """
        entry = await self.get(entry_id)
        if not entry:
            return None
        
        update_data = dict(obj_in)
        update_data["updated_at"] = datetime.utcnow()
        
        try:
            # Try to update by ObjectId
            await self.collection.update_one(
                {"_id": ObjectId(entry_id)},
                {"$set": update_data}
            )
        except InvalidId:
            # If not a valid ObjectId, update by UUID
            await self.collection.update_one(
                {"_id": entry_id},
                {"$set": update_data}
            )
        
        return await self.get(entry_id)
    
    async def delete(self, entry_id: str) -> bool:
        """
        Delete a watch history entry by ID.
        
        Args:
            entry_id: Watch history entry ID (can be ObjectId or UUID)
            
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
    
    async def get_stats_by_timeframe(
        self, 
        user_id: str, 
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Get watch statistics for a specific timeframe.
        
        Args:
            user_id: User ID
            start_date: Start date for the timeframe
            end_date: End date for the timeframe
            
        Returns:
            Dictionary with watch statistics
        """
        # Match entries for user_id within timeframe
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "watched_at": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_movies": {"$sum": 1},
                    "total_duration": {"$sum": "$watch_duration"},
                    "movies": {"$push": "$movie_id"},
                    "genres": {"$push": "$movie_details.genres"}
                }
            }
        ]
        
        results = await self.collection.aggregate(pipeline).to_list(length=1)
        
        if not results:
            return {
                "total_movies": 0,
                "total_minutes": 0,
                "favorite_genre": None
            }
        
        stats = results[0]
        
        # Calculate favorite genre if available
        favorite_genre = None
        if "genres" in stats and stats["genres"]:
            # Flatten the list of genre lists
            all_genres = [g for sublist in stats["genres"] for g in sublist if sublist]
            
            # Count genre occurrences
            genre_counts = {}
            for genre in all_genres:
                genre_counts[genre] = genre_counts.get(genre, 0) + 1
            
            # Find the most common genre
            if genre_counts:
                favorite_genre = max(genre_counts.items(), key=lambda x: x[1])[0]
        
        return {
            "total_movies": stats.get("total_movies", 0),
            "total_minutes": stats.get("total_duration", 0) // 60,  # Convert seconds to minutes
            "favorite_genre": favorite_genre
        }
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive watch statistics for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with various watch statistics
        """
        now = datetime.utcnow()
        
        # Define timeframes
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)
        year_start = now - timedelta(days=365)
        
        # Get stats for each timeframe
        weekly_stats = await self.get_stats_by_timeframe(user_id, week_start, now)
        monthly_stats = await self.get_stats_by_timeframe(user_id, month_start, now)
        yearly_stats = await self.get_stats_by_timeframe(user_id, year_start, now)
        
        # Get stats by week for the past 12 weeks
        weekly_breakdown = []
        for i in range(12):
            week_end = now - timedelta(days=i*7)
            week_start = week_end - timedelta(days=7)
            week_stats = await self.get_stats_by_timeframe(user_id, week_start, week_end)
            weekly_breakdown.append({
                "week": (now - week_start).days // 7,
                "start_date": week_start,
                "end_date": week_end,
                "minutes_watched": week_stats["total_minutes"]
            })
        
        # Get stats by month for the past 12 months
        monthly_breakdown = []
        for i in range(12):
            month_end = now.replace(day=1) - timedelta(days=i*30)
            month_start = (month_end - timedelta(days=30)).replace(day=1)
            month_stats = await self.get_stats_by_timeframe(user_id, month_start, month_end)
            monthly_breakdown.append({
                "month": month_start.strftime("%B"),
                "year": month_start.year,
                "start_date": month_start,
                "end_date": month_end,
                "minutes_watched": month_stats["total_minutes"]
            })
        
        # Combine all stats
        return {
            "total_movies": yearly_stats["total_movies"],
            "total_minutes": yearly_stats["total_minutes"],
            "favorite_genre": yearly_stats["favorite_genre"],
            "weekly_stats": weekly_breakdown,
            "monthly_stats": monthly_breakdown,
            "yearly_stats": {
                "weekly": weekly_stats,
                "monthly": monthly_stats,
                "yearly": yearly_stats
            }
        } 