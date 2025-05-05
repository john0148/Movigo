from pymongo import MongoClient

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "movigo"
USER_COLLECTION = "users"

def test_mongo_connection():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DB_NAME]
        
        # Check if connection is successful
        print(f"Successfully connected to MongoDB at {MONGODB_URL}")
        
        # Count users in collection
        user_count = db[USER_COLLECTION].count_documents({})
        print(f"Found {user_count} users in the database")
        
        # Get and print details of premium users
        premium_users = list(db[USER_COLLECTION].find({"subscription_plan": "premium"}))
        print(f"Found {len(premium_users)} premium users")
        
        if premium_users:
            # Print details of the first premium user
            user = premium_users[0]
            print("\nSample premium user:")
            print(f"ID: {user['_id']}")
            print(f"Email: {user['email']}")
            print(f"Name: {user['full_name']}")
            print(f"Plan: {user['subscription_plan']}")
            print(f"Avatar: {user['avatar_url']}")
        
        # Close connection
        client.close()
        return True
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return False

if __name__ == "__main__":
    print("Testing MongoDB connection...")
    test_mongo_connection() 