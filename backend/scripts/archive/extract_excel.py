import sys
import subprocess
import re

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import pandas as pd
except ImportError:
    install('pandas')
    install('openpyxl')
    import pandas as pd

import duckdb

# Connect to database to get all valid stop names
con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)
stops_df = con.execute("SELECT DISTINCT stop_text FROM dim_ort WHERE stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')").df()
all_stops = set(stops_df['stop_text'].dropna().tolist())

# Clean up stop names for better matching
def clean_name(name):
    if not isinstance(name, str): return ""
    return re.sub(r'\s+', ' ', name.lower().strip())

stops_clean = {clean_name(s): s for s in all_stops if s}

excel_file = "c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/Netzgrafiken VBL 6.12.2024.xlsx"
print(f"Reading from {excel_file}...")

try:
    # Read all sheets
    xls = pd.ExcelFile(excel_file)
    found_stops = set()
    
    for sheet_name in xls.sheet_names:
        print(f"\n--- Sheet: {sheet_name} ---")
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # Iterate over every cell in the dataframe
        for row in df.itertuples(index=False):
            for cell_val in row:
                if pd.isna(cell_val): continue
                cell_str = str(cell_val).strip()
                if len(cell_str) < 3: continue
                
                cell_clean = clean_name(cell_str)
                
                # Check for exact matches first
                if cell_clean in stops_clean:
                    found_stops.add(stops_clean[cell_clean])
                else:
                    # Sometimes stops in the graphic are substrings, or combined.
                    # We can do a reverse check: does a known stop name appear in the cell?
                    for clean_s, orig_s in stops_clean.items():
                        if len(clean_s) > 4 and clean_s in cell_clean:
                            found_stops.add(orig_s)
                            
    print("\n--- Extracted Stops from Excel ---")
    sorted_stops = sorted(list(found_stops))
    for s in sorted_stops:
        print(f"- {s}")
    print(f"\nTotal nodes matched with DB: {len(sorted_stops)}")

except Exception as e:
    print('Error:', e)
