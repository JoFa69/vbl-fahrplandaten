import urllib.request
import json

url = "http://localhost:8000/api/analytics/corridor/bildfahrplan?stop_id_start=PI&stop_id_end=KTB&tagesart=Mo-Fr"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode())
    trips = data.get("trips", [])
    print(f"Trips: {len(trips)}")
    if trips:
        t = trips[0]
        print(f"First trip: li_no={t['li_no']}, points={len(t['points'])}")
        print(f"First point: {t['points'][0]}")
