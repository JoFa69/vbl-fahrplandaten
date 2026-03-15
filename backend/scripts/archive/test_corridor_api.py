import requests

def test_routes():
    base_url = "http://localhost:8002/api/analytics/corridor"
    headers = {"x-scenario": "strategic"}
    stop_id = 153 # Pilatusplatz
    
    # Matrix
    r = requests.get(f"{base_url}/matrix?stop_id={stop_id}&tagesart=Mo-Fr", headers=headers)
    print("Matrix:", r.status_code, len(r.json()) if r.status_code == 200 else r.text)

    # Frequency
    r = requests.get(f"{base_url}/frequency?stop_id={stop_id}&tagesart=Mo-Fr", headers=headers)
    print("Frequency:", r.status_code, len(r.json()) if r.status_code == 200 else r.text)

    # Headway
    r = requests.get(f"{base_url}/headway?stop_id={stop_id}&tagesart=Mo-Fr", headers=headers)
    print("Headway:", r.status_code, len(r.json()) if r.status_code == 200 else r.text)

    # Bildfahrplan (stop_id_start = Pilatusplatz(153), stop_id_end = Kantonalbank(150))
    r = requests.get(f"{base_url}/bildfahrplan?stop_id_start={153}&stop_id_end={150}&tagesart=Mo-Fr", headers=headers)
    print("Bildfahrplan:", r.status_code, len(r.json().get('trips', [])) if r.status_code == 200 else r.text)

if __name__ == "__main__":
    test_routes()
