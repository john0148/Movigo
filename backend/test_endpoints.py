import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
BACKUP_URL = "http://127.0.0.1:8000/api/v1"

# For testing purposes only - in development mode the server may have authentication disabled
# or we can get a demo token
def get_demo_token():
    url = f"{BASE_URL}/demo/default-user"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            user_data = response.json()
            return f"demo_token_{user_data['id']}"
    except:
        pass
    return "demo_token_12345"  # Fallback token

def test_endpoint(endpoint, use_backup=False):
    url = f"{BACKUP_URL if use_backup else BASE_URL}/{endpoint}"
    
    # Get a demo token and create headers
    token = get_demo_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print(f"Testing endpoint: {url}")
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    print("Testing profiles/me endpoint:")
    test_endpoint("profiles/me")
    print("\nTesting watch-stats endpoint:")
    test_endpoint("watch-stats?period=week")
    
    # Try backup URL if the first attempts fail
    print("\nTrying backup URL:")
    print("\nTesting profiles/me endpoint (backup):")
    test_endpoint("profiles/me", use_backup=True)
    print("\nTesting watch-stats endpoint (backup):")
    test_endpoint("watch-stats?period=week", use_backup=True) 