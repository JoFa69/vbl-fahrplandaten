from fastapi.testclient import TestClient
import sys
import os

backend_path = os.path.join(os.getcwd(), 'backend')
sys.path.insert(0, backend_path)

from app.main import app

client = TestClient(app)

response = client.get("/api/analytics/volume")
data = response.json()

print(f"Total items: {len(data)}")
max_val = 0
if data:
    max_val = max(d['value'] for d in data)
    print(f"Max Value: {max_val}")

print("Top 5 items:")
for item in data[:5]:
    print(item)

# Check if there is huge disparity
if data:
    for i, item in enumerate(data):
        pct = (item['value'] / max_val) * 100
        if i < 10:
            print(f"{item['label']}: {item['value']} ({pct:.2f}%)")
