# crud/watch_history.py
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..schemas.profile import WatchHistoryItem
import logging

logger = logging.getLogger(__name__)

class WatchHistoryCRUD:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.watch_history

    async def get_user_history(self, user_id: str, skip: int = 0, limit: int = 10) -> List[WatchHistoryItem]:
        """Lấy lịch sử xem phim của user với phân trang"""
        try:
            # Aggregate để join với collection movies
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$sort": {"watched_at": -1}},
                {"$skip": skip},
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "movies",
                        "localField": "movie_id", 
                        "foreignField": "_id",
                        "as": "movie_info"
                    }
                },
                {"$unwind": "$movie_info"},
                {
                    "$project": {
                        "_id": {"$toString": "$_id"},
                        "movie_id": {"$toString": "$movie_id"},
                        "movie_title": "$movie_info.title",
                        "movie_poster": "$movie_info.poster_url",
                        "watched_at": "$watched_at",
                        "watch_percent": "$watch_percent",
                        "completed": "$completed",
                        "duration_seconds": "$duration_seconds"
                    }
                }
            ]
            
            cursor = self.collection.aggregate(pipeline)
            results = []
            
            async for doc in cursor:
                results.append(WatchHistoryItem(**doc))
            
            return results
            
        except Exception as e:
            logger.error(f"Lỗi khi lấy lịch sử xem phim: {str(e)}")
            raise

    async def count_user_history(self, user_id: str) -> int:
        """Đếm tổng số lịch sử xem phim của user"""
        try:
            count = await self.collection.count_documents({"user_id": user_id})
            return count
        except Exception as e:
            logger.error(f"Lỗi khi đếm lịch sử xem phim: {str(e)}")
            raise

    async def add_watch_history(self, user_id: str, movie_id: str, watch_percent: int, 
                              duration_seconds: int, completed: bool = False) -> bool:
        """Thêm/cập nhật lịch sử xem phim"""
        try:
            from datetime import datetime
            
            # Tìm xem đã có lịch sử xem phim này chưa
            existing = await self.collection.find_one({
                "user_id": user_id,
                "movie_id": movie_id
            })
            
            if existing:
                # Cập nhật lịch sử hiện tại
                await self.collection.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "watch_percent": watch_percent,
                            "completed": completed,
                            "duration_seconds": duration_seconds,
                            "watched_at": datetime.utcnow()
                        }
                    }
                )
            else:
                # Tạo lịch sử mới
                await self.collection.insert_one({
                    "user_id": user_id,
                    "movie_id": movie_id,
                    "watch_percent": watch_percent,
                    "completed": completed,
                    "duration_seconds": duration_seconds,
                    "watched_at": datetime.utcnow()
                })
            
            return True
            
        except Exception as e:
            logger.error(f"Lỗi khi thêm lịch sử xem phim: {str(e)}")
            return False
