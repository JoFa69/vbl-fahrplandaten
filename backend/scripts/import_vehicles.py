import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '20261231_fahrplandaten_2027.db')
VDV_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'vdv_schedule.duckdb')

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
        # Redefine dim_umlauf with correct schema
        print("Redefining dim_umlauf...")
        con.execute("DROP TABLE IF EXISTS dim_umlauf;")
        con.execute("""
        CREATE TABLE dim_umlauf (
            umlauf_id INTEGER PRIMARY KEY,
            umlauf_no INTEGER,
            vehicle_id INTEGER,
            umlauf_kuerzel VARCHAR
        );
        """)

        print("Populating dim_umlauf from rec_umlauf...")
        query_umlauf = """
        INSERT INTO dim_umlauf (umlauf_id, umlauf_no, vehicle_id, umlauf_kuerzel)
        SELECT DISTINCT
            CAST(UM_UID AS INTEGER) as umlauf_id,
            CAST(UM_UID AS INTEGER) as umlauf_no,
            CAST(MAX(FZG_TYP_NR) AS INTEGER) as vehicle_id,
            CAST(UM_UID AS VARCHAR) as umlauf_kuerzel
        FROM vdv.rec_umlauf
        GROUP BY UM_UID;
        """
        con.execute(query_umlauf)
        u_count = con.execute("SELECT COUNT(*) FROM dim_umlauf").fetchone()[0]
        print(f"Successfully populated {u_count} records into dim_umlauf.")

        # Since rec_umlauf links UM_UID to FZG_TYP_NR, we map it back
        # There are multiple entries per UM_UID (one for each day/trip variation in raw data).
        # We assume the FZG_TYP_NR is consistent per UM_UID.
        query_update = """
        UPDATE cub_schedule
        SET vehicle_id = (
            SELECT vehicle_id
            FROM dim_umlauf
            WHERE dim_umlauf.umlauf_id = cub_schedule.umlauf_id
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
