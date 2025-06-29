#!/usr/bin/env python3
"""
Firebase Setup Test Script
Kiểm tra xem Firebase đã được setup đúng hay chưa
"""

import os
import sys

def test_firebase_setup():
    print("🔥 Testing Firebase Setup...")
    print("=" * 50)
    
    # Test 1: Check service account key file
    print("1. Checking service account key file...")
    service_account_path = "serviceAccountKey.json"
    
    if os.path.exists(service_account_path):
        print("   ✅ Service account key found")
        
        # Check file size
        file_size = os.path.getsize(service_account_path)
        if file_size > 0:
            print(f"   ✅ File size: {file_size} bytes")
        else:
            print("   ❌ File is empty")
            return False
    else:
        print("   ❌ Service account key NOT found")
        print("   💡 Please download serviceAccountKey.json from Firebase Console")
        return False
    
    # Test 2: Try to import firebase-admin
    print("\n2. Checking firebase-admin installation...")
    try:
        import firebase_admin
        print("   ✅ firebase-admin imported successfully")
    except ImportError:
        print("   ❌ firebase-admin not installed")
        print("   💡 Run: pip install firebase-admin")
        return False
    
    # Test 3: Try to initialize Firebase
    print("\n3. Testing Firebase initialization...")
    try:
        from firebase_admin import credentials, auth
        
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print("   ✅ Firebase initialized successfully")
        else:
            print("   ✅ Firebase already initialized")
            
    except Exception as e:
        print(f"   ❌ Firebase initialization failed: {e}")
        print("   💡 Check your service account key file")
        return False
    
    # Test 4: Test Firebase Auth functionality
    print("\n4. Testing Firebase Auth...")
    try:
        # This is just a basic test to see if auth is accessible
        from firebase_admin import auth
        print("   ✅ Firebase Auth module accessible")
    except Exception as e:
        print(f"   ❌ Firebase Auth test failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Firebase setup test completed successfully!")
    print("✅ You can now use Google Authentication")
    return True

def main():
    print("Firebase Setup Test for Movigo")
    print("This script will verify your Firebase configuration\n")
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    success = test_firebase_setup()
    
    if not success:
        print("\n❌ Setup incomplete. Please follow the setup guide:")
        print("   📖 See: FIREBASE_QUICK_SETUP.md")
        sys.exit(1)
    else:
        print("\n🚀 Ready to start the application!")
        print("   Backend: uvicorn app.main:app --reload")
        print("   Frontend: npm run dev")

if __name__ == "__main__":
    main() 