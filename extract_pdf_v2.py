import sys
import subprocess
import re

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import fitz  # PyMuPDF
except ImportError:
    install('PyMuPDF')
    import fitz

import duckdb

# Connect to database to get all possible stop names
con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)
stops_df = con.execute("SELECT DISTINCT stop_text FROM dim_ort WHERE stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')").df()
all_stops = set(stops_df['stop_text'].dropna().tolist())

# Clean up stop names for better matching (lowercase, remove extra spaces)
def clean_name(name):
    if not isinstance(name, str): return ""
    return re.sub(r'\s+', ' ', name.lower().strip())

stops_clean = {clean_name(s): s for s in all_stops if s}

for file in ['Netzgrafik VBL 2025 HVZ2.pdf', 'Netzgrafik VBL 2025 NVZ So.pdf']:
    print(f'\n--- Found Nodes in {file} ---')
    try:
        doc = fitz.open(file)
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        
        # We have the full text. Let's find which stops are mentioned.
        # Since stops might be split or contain weird characters, we do a basic check.
        # A more robust way: iterate through all known stops and see if they are in the text.
        text_clean = clean_name(text)
        
        found_stops = []
        for clean_s, orig_s in stops_clean.items():
            if len(clean_s) > 3 and clean_s in text_clean:
                found_stops.append(orig_s)
                
        # Print sorted found stops
        found_stops.sort()
        for s in found_stops:
            print(f"- {s}")
            
        print(f"Total nodes extracted: {len(found_stops)}")
    except Exception as e:
        print('Error:', e)
