import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app.routers.analytics import get_infrastructure_metrics

try:
    print("Testing get_infrastructure_metrics (Top Stops)...")
    res = get_infrastructure_metrics(stop_id=None, limit=5, x_scenario="strategic")
    for r in res:
        print(f"Name: {r['label']} | Count: {r['value']}")
except Exception as e:
    print("Error:", e)
