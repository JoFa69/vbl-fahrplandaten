import duckdb
import os
import zipfile
import shutil

# Configuration
DB_FILE = 'vdv_schedule.duckdb'
DATA_DIR = 'data'
ZIP_FILE = 'VBL_FP27_220126_VDV.zip'

def setup_data_directory():
    """Extracts ZIP file if data directory is empty or missing."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    # Check if we need to extract
    # If the folder is empty or doesn't contain x10 files, try to extract
    x10_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.x10')]
    if not x10_files:
        if os.path.exists(ZIP_FILE):
            print(f"Extracting {ZIP_FILE} to {DATA_DIR}...")
            with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
                zip_ref.extractall(DATA_DIR)
        else:
            print(f"Warning: {ZIP_FILE} not found and {DATA_DIR} contains no .x10 files.")
    else:
        print(f"Data directory {DATA_DIR} already contains .x10 files. Skipping extraction.")

def import_x10_files(con):
    """Imports all .x10 files from data directory into DuckDB."""
    x10_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.x10')]
    
    if not x10_files:
        print("No .x10 files found to import.")
        return

    print(f"Found {len(x10_files)} files to import.")

    for filename in x10_files:
        table_name = os.path.splitext(filename)[0]
        file_path = os.path.join(DATA_DIR, filename)
        
        print(f"Importing {filename} into table '{table_name}'...")
        
        # Analyze file to find header and data start
        header_cols = []
        skip_rows = 0
        found_atr = False
        found_rec = False
        
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                lines = f.readlines()
                
            for i, line in enumerate(lines):
                line = line.strip()
                if line.lower().startswith('atr;'):
                    raw_cols = line.split(';')
                    header_cols = [c.strip().strip('"') for c in raw_cols[1:]]
                    found_atr = True
                
                if line.lower().startswith('rec;'):
                    skip_rows = i
                    found_rec = True
                    break
            
            if not found_atr or not header_cols:
                print(f"  -> [WARNING] Could not find 'atr;' header in {filename}. Importing as generic CSV.")
                con.execute(f"CREATE OR REPLACE TABLE '{table_name}' AS SELECT *, '{filename}' as source_filename FROM read_csv('{file_path}', header=True, sep=';', encoding='latin-1', all_varchar=True, ignore_errors=True)")
                continue

            # Construct column names
            all_col_names = ['record_type'] + header_cols
            cols_sql_list = "[" + ", ".join([f"'{c}'" for c in all_col_names]) + "]"

            if found_rec:
                # Normal import
                query = f"""
                    CREATE OR REPLACE TABLE '{table_name}' AS 
                    SELECT * EXCLUDE (record_type), '{filename}' as source_filename
                    FROM read_csv('{file_path}', 
                        names={cols_sql_list},
                        skip={skip_rows},
                        sep=';', 
                        encoding='latin-1', 
                        all_varchar=True,
                        ignore_errors=True,
                        quote='"'
                    )
                    WHERE record_type = 'rec';
                """
                con.execute(query)
                count = con.execute(f"SELECT COUNT(*) FROM '{table_name}'").fetchone()[0]
                print(f"  -> Imported {count} rows. (Columns: {len(header_cols)})")
            else:
                # Empty file (no data rows)
                # Create empty table with correct schema
                print(f"  -> [INFO] File {filename} has no data rows (no 'rec;' found). Creating empty table.")
                
                # Create columns definition: col1 VARCHAR, col2 VARCHAR...
                cols_def = ", ".join([f"\"{c}\" VARCHAR" for c in header_cols])
                con.execute(f"CREATE OR REPLACE TABLE '{table_name}' ({cols_def}, source_filename VARCHAR)")
                print(f"  -> Created empty table.")

        except Exception as e:
            print(f"  -> Error importing {filename}: {e}")

def create_views_and_cleaning(con):
    """Creates views for cleaned data."""
    print("Creating views and cleaning data...")
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    
    if 'rec_frt' in tables:
        con.execute("CREATE OR REPLACE VIEW v_rec_frt AS SELECT * FROM rec_frt")
        print("  -> Created view v_rec_frt")
    
    if 'rec_ort' in tables:
        con.execute("CREATE OR REPLACE VIEW v_rec_ort AS SELECT * FROM rec_ort")
        print("  -> Created view v_rec_ort")

def run_integrity_checks(con):
    """Runs integrity checks on the imported data."""
    print("\nRunning Integrity Checks...")
    
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    
    # Check: lid_verlauf vs rec_lid
    # Join Keys: LI_NR and STR_LI_VAR (and BASIS_VERSION potentially, but let's stick to LI_NR first)
    # Actually, let's use LI_NR + STR_LI_VAR as it defines the line variant.
    
    if 'rec_lid' in tables and 'lid_verlauf' in tables:
        print("  -> Checking orphaned Line References in lid_verlauf (LI_NR, STR_LI_VAR)...")
        
        try:
            # We assume LI_NR and STR_LI_VAR exist based on previous inspection
            # Check for orphans: entries in lid_verlauf that don't match rec_lid
            query = """
                SELECT v.LI_NR, v.STR_LI_VAR, COUNT(*) as occurrences
                FROM lid_verlauf v
                LEFT JOIN rec_lid l ON v.LI_NR = l.LI_NR AND v.STR_LI_VAR = l.STR_LI_VAR
                WHERE l.LI_NR IS NULL
                GROUP BY v.LI_NR, v.STR_LI_VAR
                ORDER BY occurrences DESC
            """
            orphans = con.execute(query).fetchall()
            
            if orphans:
                print(f"     [FAIL] Found {len(orphans)} orphaned line references:")
                for orphan in orphans[:10]: # Limit output
                    print(f"       - Line {orphan[0]} (Var {orphan[1]}): {orphan[2]} occurrences")
                if len(orphans) > 10:
                    print(f"       ... and {len(orphans)-10} more.")
            else:
                print("     [PASS] No orphaned line references found.")
                
        except Exception as e:
            print(f"     [ERROR] Could not run check: {e}")
    else:
        print("  -> Skipping line check (tables missing).")

def main():
    setup_data_directory()
    
    print(f"Connecting to DuckDB: {DB_FILE}")
    con = duckdb.connect(DB_FILE)
    
    import_x10_files(con)
    create_views_and_cleaning(con)
    run_integrity_checks(con)
    
    con.close()
    print("\nDone.")

if __name__ == "__main__":
    main()
