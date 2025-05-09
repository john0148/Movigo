#!/usr/bin/env python
"""
Migrates legacy subscription field to subscription_plan field.

Some older data uses 'subscription' field. This script migrates the data
to use subscription_plan field instead, for consistency.
"""

import json
from pymongo import MongoClient

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "movigo"

def migrate_subscriptions():
    """
    Migrate users with 'subscription' field to use 'subscription_plan'
    """
    client = None
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DB_NAME]
        collection = db["users"]
        
        # Find all users with 'subscription' field but no 'subscription_plan' field
        users_to_migrate = collection.find({
            "subscription": {"$exists": True},
            "subscription_plan": {"$exists": False}
        })
        
        # Update each user
        count = 0
        for user in users_to_migrate:
            subscription = user["subscription"]
            collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"subscription_plan": subscription},
                 "$unset": {"subscription": ""}}
            )
            print(f"Updated user {user['email']} from subscription '{subscription}' to subscription_plan")
            count += 1
        
        print(f"Updated {count} users in the database")
        
        # Also update fake_user_credentials.json if it exists
        try:
            with open("fake_user_credentials.json", "r") as f:
                credentials = json.load(f)
            
            updated = False
            for cred in credentials:
                if "subscription" in cred and "subscription_plan" not in cred:
                    cred["subscription_plan"] = cred["subscription"]
                    del cred["subscription"]
                    updated = True
            
            if updated:
                with open("fake_user_credentials.json", "w") as f:
                    json.dump(credentials, f, indent=2)
                print("Updated fake_user_credentials.json to use subscription_plan")
        except FileNotFoundError:
            print("fake_user_credentials.json not found, skipping")
        
        print("Migration completed successfully")
        
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    migrate_subscriptions() 