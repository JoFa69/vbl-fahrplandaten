with open('data/actual-date-world-traffic-point-2026-02-14.csv', 'r', encoding='utf-8') as f:
    for line in f:
        if "Obernau, Dorf" in line:
            print(line)
            break
