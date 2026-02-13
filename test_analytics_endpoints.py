from fastapi.testclient import TestClient
import sys
import os

# Add backend to path so we can import app
backend_path = os.path.join(os.getcwd(), 'backend')
sys.path.insert(0, backend_path)
print(f"Added {backend_path} to sys.path")

try:
    from app.main import app
except ImportError as e:
    print(f"Import failed: {e}")
    print("sys.path:", sys.path)
    # Check if app module exists
    print("Does backend/app exist?", os.path.exists(os.path.join(backend_path, 'app')))
    print("Does backend/app/__init__.py exist?", os.path.exists(os.path.join(backend_path, 'app', '__init__.py')))
    sys.exit(1)

client = TestClient(app)

def test_volume():
    print("--- Testing /api/analytics/volume ---")
    response = client.get("/api/analytics/volume")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Data length: {len(data)}")
        if data:
            print("Sample:", data[0])
    else:
        print("Error:", response.text)

    print("\n--- Testing /api/analytics/volume?group_by=hour ---")
    response = client.get("/api/analytics/volume?group_by=hour")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Sample:", response.json()[0] if response.json() else "Empty")

def test_geometry():
    print("\n--- Testing /api/analytics/geometry?type=lines ---")
    response = client.get("/api/analytics/geometry?type=lines")
    print(f"Status: {response.status_code}")
    first_line_id = None
    if response.status_code == 200:
        data = response.json()
        print(f"Lines count: {len(data)}")
        if data:
            print("First Line:", data[0])
            first_line_id = data[0].get('id')
            
    if first_line_id:
        print(f"\n--- Testing /api/analytics/geometry?type=variants&line_id={first_line_id} ---")
        response = client.get(f"/api/analytics/geometry?type=variants&line_id={first_line_id}")
        print(f"Status: {response.status_code}")
        variants = response.json()
        print("Variants:", variants)
        
        if variants:
            variant_id = variants[0]['id']
            print(f"\n--- Testing /api/analytics/geometry?type=stops&variant_id={variant_id} ---")
            response = client.get(f"/api/analytics/geometry?type=stops&variant_id={variant_id}")
            print(f"Status: {response.status_code}")
            stops = response.json()
            print(f"Stops count: {len(stops)}")
            if stops:
                print("First Stop:", stops[0])

def test_time():
    print("\n--- Testing /api/analytics/time ---")
    response = client.get("/api/analytics/time") # Default metric=duration
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Sample:", response.json()[0] if response.json() else "Empty")

def test_infrastructure():
    print("\n--- Testing /api/analytics/infrastructure ---")
    response = client.get("/api/analytics/infrastructure")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Top stops count: {len(data)}")
        if data:
            print("Top Stop:", data[0])
            stop_id = data[0]['id']  # ideal_stop_nr
            print(f"\n--- Testing Stop Drilldown for ID: {stop_id} ---")
            response = client.get(f"/api/analytics/infrastructure?stop_id={stop_id}")
            print(f"Status: {response.status_code}")
            load = response.json()
            print(f"Load points: {len(load)}")

if __name__ == "__main__":
    try:
        test_volume()
        test_geometry()
        test_time()
        test_infrastructure()
    except Exception as e:
        print(f"Test Execution Failed: {e}")
