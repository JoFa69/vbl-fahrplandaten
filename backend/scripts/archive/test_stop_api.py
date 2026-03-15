import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.routers.data import get_stops, get_line_stops

try:
    print("Testing get_stops()...")
    stops = get_stops(x_scenario="strategic")
    print(f"Total stops: {len(stops)}")
    print(f"Sample: {stops[0]}")
    
    print("\\nTesting get_stops(ort='Luzern')...")
    luzern_stops = get_stops(ort="Luzern", x_scenario="strategic")
    print(f"Total Luzern stops: {len(luzern_stops)}")
    print(f"Sample Luzern stop: {luzern_stops[0] if luzern_stops else 'None'}")
    
    print("\\nTesting get_line_stops('1')...")
    line_stops = get_line_stops('1', x_scenario="strategic")
    print(f"Total line 1 stops: {len(line_stops)}")
    print(f"Sample line 1 stop: {line_stops[0] if line_stops else 'None'}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
