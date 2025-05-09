from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import uuid
import bcrypt
import os
import json

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "movigo"

# User credentials to remember for auto-login
SAVED_CREDENTIALS = []

def generate_fake_users(count=10):
    """Generate fake user data for the database"""
    users = []
    subscription_plans = ["free", "basic", "standard", "premium"]
    
    # Admin user (will always be created)
    admin_password = "admin123"
    admin_password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    
    admin_user = {
        "_id": str(uuid.uuid4()),
        "email": "admin@movigo.com",
        "password": admin_password_hash,  # Hashed for DB
        "full_name": "Admin User",
        "role": "admin",
        "subscription_plan": "premium",
        "avatar_url": f"/avatars/default-avatar.png",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_active": True,
        "preferences": {
            "language": "vi",
            "notifications_enabled": True
        }
    }
    
    users.append(admin_user)
    
    # Save admin credentials for auto-login
    SAVED_CREDENTIALS.append({
        "email": "admin@movigo.com",
        "password": admin_password,  # Clear text for auto-login
        "subscription": "premium",
        "role": "admin"
    })
    
    # Regular users
    for i in range(count):
        subscription = random.choice(subscription_plans)
        password = f"user{i}pass"
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        
        user = {
            "_id": str(uuid.uuid4()),
            "email": f"user{i}@example.com",
            "password": password_hash,  # Hashed for DB
            "full_name": f"User {i}",
            "role": "user",
            "subscription_plan": subscription,
            "avatar_url": f"/avatars/default-avatar.png",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "is_active": True,
            "preferences": {
                "language": random.choice(["vi", "en"]),
                "notifications_enabled": random.choice([True, False])
            }
        }
        
        users.append(user)
        
        # Save random 3 users for auto-login testing
        if i < 3:
            SAVED_CREDENTIALS.append({
                "email": f"user{i}@example.com",
                "password": password,  # Clear text for auto-login
                "subscription": subscription,
                "role": "user"
            })
    
    return users

def generate_watch_history(user_ids, movie_ids, count_per_user=5):
    """Generate fake watch history records"""
    watch_history = []
    
    for user_id in user_ids:
        for _ in range(random.randint(1, count_per_user)):
            movie_id = random.choice(movie_ids)
            watch_percent = random.randint(10, 100)
            
            record = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "movie_id": movie_id,
                "watched_at": datetime.now() - timedelta(days=random.randint(0, 30)),
                "watch_percent": watch_percent,
                "completed": watch_percent == 100,
                "duration_seconds": random.randint(300, 7200)
            }
            
            watch_history.append(record)
    
    return watch_history

def generate_fake_movies(count=20):
    """Generate fake movie data"""
    movies = []
    genres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Animation", "Romance", "Thriller"]
    
    for i in range(count):
        release_year = random.randint(1990, 2024)
        duration_minutes = random.randint(90, 180)
        
        movie = {
            "_id": str(uuid.uuid4()),
            "title": f"Movie {i+1}",
            "description": f"This is a description for Movie {i+1}. An exciting film that will keep you entertained.",
            "genres": random.sample(genres, random.randint(1, 3)),
            "release_year": release_year,
            "duration_minutes": duration_minutes,
            "poster_url": f"/assets/posters/movie{i+1}.jpg",
            "video_url": f"/assets/videos/movie{i+1}.mp4",
            "view_count": random.randint(10, 10000),
            "rating": round(random.uniform(1.0, 5.0), 1),
            "is_featured": random.random() < 0.2,  # 20% chance to be featured
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        
        movies.append(movie)
    
    return movies

def save_credentials():
    """Save credentials to a file for easy access"""
    with open("fake_user_credentials.json", "w") as f:
        json.dump(SAVED_CREDENTIALS, f, indent=2)
    
    print(f"Saved {len(SAVED_CREDENTIALS)} user credentials to fake_user_credentials.json")
    
    # Print auto-login info for the first user
    if SAVED_CREDENTIALS:
        auto_login_user = SAVED_CREDENTIALS[0]
        print("\n=== AUTO LOGIN CONFIGURATION ===")
        print(f"Email: {auto_login_user['email']}")
        print(f"Password: {auto_login_user['password']}")
        print(f"Role: {auto_login_user['role']}")
        print(f"Subscription: {auto_login_user['subscription']}")
        print("\nTo enable auto-login, create a .env file in the frontend directory with:")
        print("VITE_AUTO_LOGIN_EMAIL=" + auto_login_user['email'])
        print("VITE_AUTO_LOGIN_PASSWORD=" + auto_login_user['password'])

def main():
    """Main function to generate and insert data"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DB_NAME]
        
        # Drop existing collections to start fresh
        db.users.drop()
        db.movies.drop()
        db.watch_history.drop()
        
        # Generate and insert fake data
        print("Generating fake users...")
        users = generate_fake_users(10)
        db.users.insert_many(users)
        print(f"Inserted {len(users)} users")
        
        # Extract user IDs
        user_ids = [user["_id"] for user in users]
        
        print("Generating fake movies...")
        movies = generate_fake_movies(20)
        db.movies.insert_many(movies)
        print(f"Inserted {len(movies)} movies")
        
        # Extract movie IDs
        movie_ids = [movie["_id"] for movie in movies]
        
        print("Generating fake watch history...")
        watch_history = generate_watch_history(user_ids, movie_ids)
        db.watch_history.insert_many(watch_history)
        print(f"Inserted {len(watch_history)} watch history records")
        
        # Save credentials for auto-login
        save_credentials()
        
        # Close connection
        client.close()
        print("Done!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 