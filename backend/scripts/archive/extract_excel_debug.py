import pandas as pd

excel_file = "c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/Netzgrafiken VBL 6.12.2024.xlsx"
print(f"Reading from {excel_file}...")

try:
    xls = pd.ExcelFile(excel_file)
    for sheet_name in xls.sheet_names:
        print(f"\n--- Sheet: {sheet_name} ---")
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # print first 20 non-null cells
        count = 0
        for row in df.itertuples(index=False):
            for cell_val in row:
                if pd.isna(cell_val): continue
                cell_str = str(cell_val).strip()
                if len(cell_str) > 2:
                    print(repr(cell_str))
                    count += 1
                if count >= 20: break
            if count >= 20: break
            
except Exception as e:
    print('Error:', e)
