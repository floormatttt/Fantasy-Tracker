import re
import json
import glob
import pandas as pd

with open('fantasypros.txt', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content)} chars / {len(content)//1024//1024} MB")

# Count HTML docs
doc_count = content.count('<!DOCTYPE')
print(f"HTML documents found: {doc_count}")

# Find ALL "rows": [...] blocks
fp_id_map = {}
rows_pattern = re.compile(r'"rows"\s*:\s*\[')

block_count = 0
total_player_entries = 0
for match in rows_pattern.finditer(content):
    start_bracket = match.end() - 1
    depth = 0
    end_pos = start_bracket
    for i in range(start_bracket, len(content)):
        c = content[i]
        if c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                end_pos = i + 1
                break

    rows_json = content[start_bracket:end_pos]
    try:
        rows = json.loads(rows_json)
        block_count += 1
        count = 0
        for row in rows:
            player = row.get('player', {})
            name = player.get('name', '')
            fp_id = player.get('id', '')
            if name and fp_id:
                fp_id_map[name] = str(fp_id)
                count += 1
        total_player_entries += count
        print(f"  Block {block_count}: {count} players")
    except json.JSONDecodeError as e:
        print(f"  Block parse error at pos {match.start()}: {e}")

print(f"\nTotal data blocks: {block_count}")
print(f"Total player entries parsed: {total_player_entries}")
print(f"Unique players in map: {len(fp_id_map)}")
print("\nSample entries:")
for name, fp_id in list(fp_id_map.items())[:10]:
    print(f"  {name} -> {fp_id}")

# Apply to Past FF Data CSVs
updated_files = 0
updated_entries = 0
unmatched = set()

for f in sorted(glob.glob('Past FF Data/*.csv')):
    try:
        df = pd.read_csv(f, dtype=str, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(f, dtype=str, encoding='latin1')

    if 'Player' not in df.columns:
        continue

    if 'PLAYER_ID' not in df.columns:
        player_col_idx = df.columns.get_loc('Player')
        df.insert(player_col_idx + 1, 'PLAYER_ID', '')

    changed = False
    for idx, row in df.iterrows():
        name = str(row['Player']).strip() if pd.notna(row['Player']) else ''
        current_id = str(row.get('PLAYER_ID', ''))
        has_id = current_id != '' and current_id != 'nan'
        if name in fp_id_map:
            new_id = fp_id_map[name]
            if not has_id:
                df.at[idx, 'PLAYER_ID'] = new_id
                changed = True
                updated_entries += 1
        elif name and not has_id:
            unmatched.add(name)

    if changed:
        df.to_csv(f, index=False)
        updated_files += 1

# Apply to FF JSON files
for jf in sorted(glob.glob('frontend/public/ff_data/*.json')):
    try:
        with open(jf, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except:
        continue

    if not isinstance(data, list):
        continue

    changed = False
    for item in data:
        name = str(item.get('Player', '')).strip()
        current_id = str(item.get('PLAYER_ID', ''))
        has_id = current_id != '' and current_id != 'None' and current_id != 'nan'
        if name in fp_id_map:
            new_id = fp_id_map[name]
            if not has_id:
                item['PLAYER_ID'] = new_id
                changed = True
                updated_entries += 1
        elif name and not has_id:
            unmatched.add(name)

    if changed:
        with open(jf, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2)
        updated_files += 1

print(f"\nUpdated {updated_entries} entries across {updated_files} files.")
print(f"Still unmatched: {len(unmatched)} unique player names.")
if unmatched:
    print("Sample unmatched:")
    for name in sorted(list(unmatched))[:30]:
        print(f"  {name}")
