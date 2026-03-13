import duckdb
import os

DB_PATH = '20261231_fahrplandaten_2027.db'
VDV_DB_PATH = 'vdv_schedule.duckdb'

def main():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return
        
    if not os.path.exists(VDV_DB_PATH):
        print(f"Error: {VDV_DB_PATH} not found.")
        return

    print(f"Connecting to {DB_PATH} (Read/Write Mode)...")
    try:
        con = duckdb.connect(DB_PATH, read_only=False)
    except Exception as e:
        print(f"Failed to connect to DB in write mode. Please ensure the backend server (uvicorn) is stopped! Error: {e}")
        return

    try:
        print(f"Attaching VDV database {VDV_DB_PATH}...")
        con.execute(f"ATTACH '{VDV_DB_PATH}' AS vdv (READ_ONLY);")

        print("Updating dim_vehicle...")
        # Populate dim_vehicle from menge_fzg_typ
        query_vehicle = """
        INSERT INTO dim_vehicle (vehicle_id, vehicle_type, vehicle_steh, vehicle_platz)
        SELECT 
            CAST(FZG_TYP_NR AS INTEGER),
            CAST(FZG_TYP_TEXT AS VARCHAR),
            CAST(FZG_TYP_STEH AS INTEGER),
            CAST(FZG_TYP_SITZ AS INTEGER) + CAST(FZG_TYP_STEH AS INTEGER) -- Total places
        FROM vdv.menge_fzg_typ
        ON CONFLICT(vehicle_id) DO UPDATE SET 
            vehicle_type = EXCLUDED.vehicle_type,
            vehicle_steh = EXCLUDED.vehicle_steh,
            vehicle_platz = EXCLUDED.vehicle_platz;
        """
        con.execute(query_vehicle)
        
        # Check how many vehicles we inserted
        v_count = con.execute("SELECT COUNT(*) FROM dim_vehicle").fetchone()[0]
        print(f"Successfully ensured {v_count} vehicles are in dim_vehicle.")

        print("Mapping Umläufe to Vehicles in cub_schedule...")
        # Since rec_umlauf links UM_UID to FZG_TYP_NR, we map it back
        # There are multiple entries per UM_UID (one for each day/trip variation in raw data).
        # We assume the FZG_TYP_NR is consistent per UM_UID.
        query_update = """
        UPDATE cub_schedule
        SET vehicle_id = (
            SELECT CAST(MAX(r.FZG_TYP_NR) AS INTEGER)
            FROM vdv.rec_umlauf r
            WHERE CAST(r.UM_UID AS INTEGER) = cub_schedule.umlauf_id
        )
        WHERE vehicle_id IS NULL;
        """
        con.execute(query_update)

        # Let's count how many we mapped successfully
        mapped_count = con.execute("SELECT COUNT(*) FROM cub_schedule WHERE vehicle_id IS NOT NULL").fetchone()[0]
        unmapped_count = con.execute("SELECT COUNT(*) FROM cub_schedule WHERE vehicle_id IS NULL").fetchone()[0]
        
        print(f"Success! {mapped_count} trips mapped to a vehicle type. {unmapped_count} remain unmapped.")

    except Exception as e:
        print(f"An error occurred during execution: {e}")
    finally:
        con.close()
        print("Done.")

if __name__ == "__main__":
    main()
