import requests

def test_operative_db():
    base_url = "http://localhost:8000"
    headers = {"x-scenario": "operative"}
    
    print("Testing operative DB connection via API...")
    try:
        # Test basic route: get_lines
        resp = requests.get(f"{base_url}/data/lines", headers=headers)
        if resp.status_code == 200:
            lines = resp.json()
            print(f"✅ /data/lines: Found {len(lines)} lines")
            if lines:
                print("   Example:", lines[0])
        else:
            print(f"❌ /data/lines failed: {resp.status_code} - {resp.text}")

        # Test timetable tagesarten (to see if 'Mo-Do', 'Fr' works)
        resp = requests.get(f"{base_url}/analytics/timetable/tagesarten", headers=headers)
        if resp.status_code == 200:
            ta = resp.json()
            print(f"✅ /analytics/timetable/tagesarten: {ta}")
        else:
            print(f"❌ /analytics/timetable/tagesarten failed: {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print(f"Error connecting to API: {e}")

if __name__ == "__main__":
    test_operative_db()
