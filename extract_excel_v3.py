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
                            
    # Word based matching
    matched_nodes = set()
    unmatched_nodes = set()
    
    def get_words(text):
        # split by non-alphanumeric, filter small words
        words = re.split(r'[^a-zA-Z0-9äöüÄÖÜ]', text.lower())
        return set([w for w in words if len(w) > 2])

    db_stop_words = {s: get_words(s) for s in all_stops}
    
    for en in extracted_nodes:
        en_words = get_words(en)
        if not en_words:
            continue
            
        match_found = False
        
        # We consider a match if *all* words in the excel cell appear in the DB stop name
        # OR if it's a very clear substring match ignoring spaces.
        en_clean_concat = "".join(en_words)
        
        best_match = None
        best_match_score = 0
        
        for db_stop, db_words in db_stop_words.items():
            if not db_words: continue
            
            # Substring match (e.g. "Adligenswil Dorf" -> "adligenswildorf" in "adligenswildorf")
            db_clean_concat = "".join(db_words)
            if en_clean_concat in db_clean_concat or db_clean_concat in en_clean_concat:
                 if len(en_clean_concat) > 5 and len(db_clean_concat) > 5:
                     best_match = db_stop
                     break
            
            # Word overlap match
            overlap = len(en_words.intersection(db_words))
            if overlap == len(en_words) and len(en_words) > 0:
                # All words from excel are in db stop (e.g. "Adligenswil", "Dorf" in "Adligenswil, Dorf")
                best_match = db_stop
                break
                
        if best_match:
            matched_nodes.add(best_match)
        else:
            unmatched_nodes.add(en)
            
    print("\n--- Extracted & Matched Stops ---")
    sorted_matched = sorted(list(matched_nodes))
    for s in sorted_matched:
         print(f"- {s}")
         
    print(f"\nTotal DB Stops matched: {len(matched_nodes)}")
    
    print("\n--- Unmatched Nodes (likely text artifacts or special names) ---")
    for s in sorted(list(unmatched_nodes)):
         print(f"- {s}")

    # Write the matched stops to a file so the agent can use it later
    with open('extracted_nodes_from_excel.txt', 'w', encoding='utf-8') as f:
         for s in sorted_matched:
              f.write(s + '\n')

except Exception as e:
    print('Error:', e)
