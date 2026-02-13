import requests
import os

BASE_URL = "http://localhost:8081/api"

def test_analytics():
    print("Testing Analytics Endpoints...")
    endpoints = ["analytics/stats", "analytics/stops-by-line", "analytics/trips-per-hour"]
    for ep in endpoints:
        try:
            res = requests.get(f"{BASE_URL}/{ep}")
            if res.status_code == 200:
                print(f"[OK] {ep}")
                # print(res.json())
            else:
                print(f"[FAIL] {ep}: Failed ({res.status_code}) - {res.text}")
        except Exception as e:
            print(f"[ERROR] {ep}: {e}")

def test_ai():
    print("\nTesting AI Endpoint...")
    # This might fail if GOOGLE_API_KEY is not set in the backend process
    question = "Wie viele Linien gibt es?"
    try:
        res = requests.post(f"{BASE_URL}/ai/ask", json={"question": question})
        if res.status_code == 200:
            print(f"[OK] AI Ask")
            print(f"Response: {res.json().get('answer')}")
            print(f"SQL: {res.json().get('sql')}")
        else:
            print(f"[FAIL] AI Ask: Failed ({res.status_code}) - {res.text}")
            print("NOTE: This is expected if GOOGLE_API_KEY is not set.")
    except Exception as e:
        print(f"[ERROR] AI Ask: {e}")

def test_root():
    print("\nTesting Root Endpoint...")
    try:
        res = requests.get(f"http://localhost:8081/")
        print(f"Status: {res.status_code}")
        print(f"Headers: {res.headers}")
        print(f"Content: {res.text}")
    except Exception as e:
        print(f"[ERROR] Root: {e}")

if __name__ == "__main__":
    test_root()
    test_analytics()
    test_ai()
