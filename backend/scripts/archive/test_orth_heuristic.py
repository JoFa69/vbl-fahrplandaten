import duckdb
import pandas as pd

pd.set_option('display.max_rows', 500)

con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)

query = """
SELECT DISTINCT stop_point_text FROM dim_ort
"""

df = con.execute(query).df()

# create basic heuristic
def parse_stop(text):
    if ',' in text:
        parts = text.split(',', 1)
        return parts[0].strip(), parts[1].strip()
    elif '-' in text and ' ' not in text:
        parts = text.split('-', 1)
        return parts[0].strip(), parts[1].strip()
    else:
        # space split, but watch out for 'St. ' or ' LU ' options
        parts = text.split(' ', 1)
        if len(parts) > 1:
            if parts[0] == 'St.':
                # split on next space
                sub_parts = parts[1].split(' ', 1)
                ort = parts[0] + ' ' + sub_parts[0]
                rest = sub_parts[1] if len(sub_parts) > 1 else ''
                # Handle 'LU'
                if rest.startswith('LU '):
                    ort += ' LU'
                    rest = rest[3:]
                return ort, rest
            else:
                ort = parts[0]
                rest = parts[1]
                if rest.startswith('LU '):
                    ort += ' LU'
                    rest = rest[3:]
                return ort, rest
        else:
            return text, text

df['parsed'] = df['stop_point_text'].apply(parse_stop)
df['ort'] = df['parsed'].apply(lambda x: x[0])
df['name'] = df['parsed'].apply(lambda x: x[1])

print(df[['stop_point_text', 'ort', 'name']].head(100))
print("\\nUnique Ortschaften:\\n", df['ort'].unique())
