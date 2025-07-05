# backend/scripts/normalize_movies.py

from pymongo import MongoClient
import re
import unicodedata

# === Hàm xử lý dấu tiếng Việt ===
def remove_vietnamese_tones(text):
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'đ', 'd', text)
    text = re.sub(r'Đ', 'D', text)
    return text

def clean_query(text):
    text = remove_vietnamese_tones(text.lower())
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# === Kết nối MongoDB ===
client = MongoClient("mongodb://localhost:27017")  # Đổi nếu bạn dùng Docker hay URI khác
db = client["movigo"]  # Tên DB của bạn
collection = db["movies"]

# === Duyệt và cập nhật từng phim ===
updated = 0
for movie in collection.find():
    title = movie.get("title", "")
    description = movie.get("overview", "")  # hoặc "description" nếu bạn rename field này

    normalized_title = clean_query(title)
    normalized_description = clean_query(description)

    result = collection.update_one(
        {"_id": movie["_id"]},
        {"$set": {
            "normalized_title": normalized_title,
            "normalized_description": normalized_description
        }}
    )

    if result.modified_count:
        updated += 1

print(f"✅ Đã cập nhật {updated} phim với normalized fields.")
