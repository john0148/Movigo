class CommentCRUD:
    def __init__(self, db):
        self.collection = db["comments"]

    async def get_by_movie_id(self, movie_id: str):
        doc = await self.collection.find_one({"movie_id": movie_id})
        if not doc or "comments" not in doc:
            return []
        
        comments = []
        for comment in doc["comments"]:
            # Kiểm tra xem trường _id có tồn tại
            if "_id" in comment:
                comment["_id"] = str(comment["_id"])  # Đảm bảo _id là dạng string
            else:
                comment["_id"] = None  # Hoặc xử lý theo cách khác nếu muốn

            comment["movie_id"] = movie_id  # Thêm movie_id
            comments.append(comment)
        
        return comments
