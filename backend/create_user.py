#!/usr/bin/env python
"""
Create User Command-Line Tool

This utility allows creating a user in MongoDB via the command line.
Useful for creating initial admin or test users.

Usage:
    python create_user.py
"""

import asyncio
import getpass
import logging
import sys
from pathlib import Path

# Add the parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.db.database import connect_to_mongodb, close_mongodb_connection
from app.core.security import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Available subscription plans
SUBSCRIPTION_PLANS = ["free", "basic", "standard", "premium"]

async def create_user():
    """
    Interactive function to create a user in MongoDB
    """
    # Connect to MongoDB
    db = await connect_to_mongodb()
    if db is None:
        logger.error("Failed to connect to MongoDB. Cannot create user.")
        return False

    try:
        # Check if users collection exists
        collections = await db.list_collection_names()
        if "users" not in collections:
            logger.warning("Users collection does not exist. It will be created automatically.")
        
        # Get user input
        print("\n===== Create New User =====")
        email = input("Email: ").strip()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            print(f"User with email {email} already exists!")
            update = input("Do you want to update this user? (y/n): ").lower().strip()
            if update != 'y':
                print("Operation cancelled.")
                return False
        
        # Get password (masked input)
        password = getpass.getpass("Password: ")
        if not password:
            print("Password cannot be empty!")
            return False
            
        # Hash the password
        hashed_password = get_password_hash(password)
        
        # Get other user details
        full_name = input("Full Name: ").strip()
        
        # Select role
        print("\nSelect Role:")
        print("1. user (regular user)")
        print("2. admin (administrator)")
        role_choice = input("Choice (1/2) [default: 1]: ").strip()
        role = "admin" if role_choice == "2" else "user"
        
        # Select subscription plan
        print("\nSelect Subscription Plan:")
        for i, plan in enumerate(SUBSCRIPTION_PLANS, 1):
            print(f"{i}. {plan}")
        plan_choice = input(f"Choice (1-{len(SUBSCRIPTION_PLANS)}) [default: 1]: ").strip()
        
        try:
            plan_index = int(plan_choice) - 1
            if plan_index < 0 or plan_index >= len(SUBSCRIPTION_PLANS):
                plan_index = 0
        except ValueError:
            plan_index = 0
            
        subscription_plan = SUBSCRIPTION_PLANS[plan_index]
        
        # Optional fields
        phone = input("Phone (optional): ").strip()
        birth_date = input("Birth Date (YYYY-MM-DD) (optional): ").strip()
        
        print("\nSelect Gender:")
        print("1. male")
        print("2. female")
        print("3. other")
        gender_choice = input("Choice (1/2/3) [optional]: ").strip()
        
        gender = None
        if gender_choice == "1":
            gender = "male"
        elif gender_choice == "2":
            gender = "female"
        elif gender_choice == "3":
            gender = "other"
        
        # Prepare user data
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "full_name": full_name,
            "role": role,
            "subscription_plan": subscription_plan,
            "is_active": True,
            "max_devices": 1,  # Will be updated based on subscription plan
        }
        
        # Set max_devices based on subscription plan
        if subscription_plan == "premium":
            user_data["max_devices"] = 4
        elif subscription_plan == "standard":
            user_data["max_devices"] = 2
        elif subscription_plan == "basic":
            user_data["max_devices"] = 1
        else:  # free
            user_data["max_devices"] = 1
        
        # Add optional fields if provided
        if phone:
            user_data["phone"] = phone
        if birth_date:
            user_data["birth_date"] = birth_date
        if gender:
            user_data["gender"] = gender
            
        # Add default avatar
        user_data["avatar_url"] = "/avatars/default-avatar.png"
        
        # Current timestamp
        user_data["created_at"] = {"$date": {"$numberLong": str(int(asyncio.get_event_loop().time() * 1000))}}
        
        # Insert or update user
        if existing_user:
            result = await db.users.update_one(
                {"email": email},
                {"$set": user_data}
            )
            if result.modified_count > 0:
                print(f"\n✅ Successfully updated user: {email}")
                print(f"Role: {role}")
                print(f"Subscription Plan: {subscription_plan}")
                return True
            else:
                print("\n❌ Failed to update user!")
                return False
        else:
            result = await db.users.insert_one(user_data)
            if result.inserted_id:
                print(f"\n✅ Successfully created user: {email}")
                print(f"Role: {role}")
                print(f"Subscription Plan: {subscription_plan}")
                return True
            else:
                print("\n❌ Failed to create user!")
                return False
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        print(f"\n❌ Error: {e}")
        return False
    finally:
        # Close MongoDB connection
        await close_mongodb_connection()

if __name__ == "__main__":
    print("===== MongoDB User Creation Tool =====")
    asyncio.run(create_user()) 