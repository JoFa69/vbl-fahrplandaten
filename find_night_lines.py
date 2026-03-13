import re

target_pattern = re.compile(r';\"(N\d+)\";')
fpath = 'data/rec_lid.x10'

lines_found = {}

with open(fpath, 'r', encoding='latin-1') as f:
    for line in f:
        m = target_pattern.search(line)
        if m:
            parts = line.split(';')
            li_nr = parts[2]
            li_abbr = m.group(1)
            lines_found[li_nr] = li_abbr

for nr in sorted(lines_found.keys(), key=lambda x: int(x)):
    print(f"LI_NR {nr} -> {lines_found[nr]}")
