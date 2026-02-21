import duckdb
import os

db_path = os.path.join(os.path.dirname(__file__), '../../../data/vbl_data.duckdb')
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/vbl_data.duckdb'))
    print(f"Trying: {db_path}")

con = duckdb.connect(db_path, read_only=True)
print("dim_route samples:")
print(con.execute("SELECT ideal_stop_nr, ideal_stop_text FROM dim_route LIMIT 5;").df())

print("\ndim_ort samples:")
print(con.execute("SELECT stop_abbr, stop_name FROM dim_ort LIMIT 5;").df())
