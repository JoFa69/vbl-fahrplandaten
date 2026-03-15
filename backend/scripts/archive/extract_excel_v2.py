import pandas as pd
import duckdb
import re

con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)
stops_df = con.execute('''
    SELECT DISTINCT stop_text 
    FROM dim_ort 
    WHERE stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')
''').df()
all_stops = set(stops_df['stop_text'].dropna().tolist())

# Clean up stop names for better matching
def clean_name(name):
    if not isinstance(name, str): return ""
    # remove punctuation and spaces, lower case
    s = re.sub(r'[^a-zA-Z0-9äöüÄÖÜ]', '', name.lower())
    return s

# Create a mapping from cleaned name to original name
# To handle cases where DB name is longer (e.g. 'Luzern, Bahnhof' vs 'Bahnhof')
# This is tricky without a proper fuzzy matcher, so let's just collect all cells
# with letters that are > 3 chars, and then we will manually inspect the list
# or try a partial match.
stops_clean = {clean_name(s): s for s in all_stops if clean_name(s)}

excel_file = "c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/Netzgrafiken VBL 6.12.2024.xlsx"

try:
    xls = pd.ExcelFile(excel_file)
    extracted_nodes = set()
    
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        for row in df.itertuples(index=False):
            for cell_val in row:
                if pd.isna(cell_val): continue
                cell_str = str(cell_val).strip()
                
                # Check if it contains letters (to filter out pure numbers like '110.0')
                if re.search(r'[a-zA-ZäöüÄÖÜ]', cell_str) and len(cell_str) > 3:
                     # Remove line breaks that might exist inside cells
                     cell_str = cell_str.replace('\n', ' ')
                     extracted_nodes.add(cell_str)
                            
    # Now try to match the extracted nodes against the database
    matched_nodes = set()
    unmatched_nodes = set()
    
    for en in extracted_nodes:
        en_clean = clean_name(en)
        match_found = False
        
        # Exact match of cleaned strings
        if en_clean in stops_clean:
            matched_nodes.add(stops_clean[en_clean])
            match_found = True
        else:
            # Substring match: If the Excel string is a substring of the DB string
            # e.g. Excel: "Gisikon-Root Bahnhof" -> "gisikonrootbahnhof"
            # DB: "Gisikon-Root, Bahnhof" -> "gisikonrootbahnhof"
            for clean_db_stop, orig_db_stop in stops_clean.items():
                if en_clean in clean_db_stop or clean_db_stop in en_clean:
                    if len(en_clean) > 5 and len(clean_db_stop) > 5: # prevent false positives on short strings
                        matched_nodes.add(orig_db_stop)
                        match_found = True
                        break
        
        if not match_found:
             unmatched_nodes.add(en)
            
    print("\n--- Extracted & Matched Stops ---")
    for s in sorted(list(matched_nodes)):
         print(f"- {s}")
         
    print(f"\nTotal Nodes matched: {len(matched_nodes)}")
    
    print("\n--- Top 20 Unmatched Nodes (likely text artifacts or special names) ---")
    for s in sorted(list(unmatched_nodes))[:20]:
         print(f"- {s}")

except Exception as e:
    print('Error:', e)
