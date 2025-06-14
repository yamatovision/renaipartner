#!/usr/bin/env python3
import re
import os
from pathlib import Path

# プロジェクトのルートディレクトリ
PROJECT_ROOT = Path(__file__).parent

# backgrounds-data.tsから画像IDとURLを抽出
def extract_from_backgrounds_data():
    file_path = PROJECT_ROOT / "backend/src/features/images/backgrounds-data.ts"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # IDとURLのペアを抽出
    id_pattern = r"id:\s*'([^']+)'"
    url_pattern = r"url:\s*'([^']+)'"
    location_pattern = r"locationId:\s*'([^']+)'"
    
    ids = re.findall(id_pattern, content)
    urls = re.findall(url_pattern, content)
    locations = re.findall(location_pattern, content)
    
    # IDとURL、locationIdをマッピング
    data = []
    for i in range(len(ids)):
        data.append({
            'id': ids[i],
            'url': urls[i] if i < len(urls) else None,
            'locationId': locations[i] if i < len(locations) else None
        })
    
    return data

# location-background-map.tsから参照を抽出
def extract_from_location_map():
    file_path = PROJECT_ROOT / "backend/src/features/locations/location-background-map.ts"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # locationIdと画像IDのマッピングを抽出
    location_map = {}
    
    # パターン: 'location_id': ['image_id1', 'image_id2', ...]
    pattern = r"'([^']+)':\s*\[((?:\s*'[^']+',?\s*)+)\]"
    matches = re.findall(pattern, content)
    
    for location_id, image_ids_str in matches:
        # 画像IDを抽出
        image_ids = re.findall(r"'([^']+)'", image_ids_str)
        location_map[location_id] = image_ids
    
    return location_map

# 実際のファイルシステムをチェック
def check_actual_files():
    backgrounds_dir = PROJECT_ROOT / "frontend/public/images/backgrounds"
    actual_files = []
    
    for path in backgrounds_dir.rglob("*.jpg"):
        relative_path = "/" + str(path.relative_to(PROJECT_ROOT / "frontend/public"))
        actual_files.append(relative_path.replace("\\", "/"))
    
    return sorted(actual_files)

# 整合性チェック
def check_consistency():
    print("=== 背景画像システム整合性チェック ===\n")
    
    # データを取得
    backgrounds_data = extract_from_backgrounds_data()
    location_map = extract_from_location_map()
    actual_files = check_actual_files()
    
    # 1. backgrounds-data.tsの画像IDとlocation-background-map.tsの参照をチェック
    print("1. backgrounds-data.ts と location-background-map.ts の整合性:")
    
    # backgrounds-data.tsのIDセット
    bg_ids = set(item['id'] for item in backgrounds_data)
    
    # location-background-map.tsで参照されているIDセット
    referenced_ids = set()
    for location, ids in location_map.items():
        referenced_ids.update(ids)
    
    # 未参照の画像ID
    unreferenced = bg_ids - referenced_ids
    if unreferenced:
        print(f"  ❌ backgrounds-data.tsで定義されているが、location-background-map.tsで参照されていない画像ID:")
        for id in sorted(unreferenced):
            print(f"    - {id}")
    
    # 存在しない画像IDへの参照
    non_existent = referenced_ids - bg_ids
    if non_existent:
        print(f"  ❌ location-background-map.tsで参照されているが、backgrounds-data.tsに存在しない画像ID:")
        for id in sorted(non_existent):
            print(f"    - {id}")
    
    if not unreferenced and not non_existent:
        print("  ✅ すべての画像IDが正しく定義・参照されています")
    
    print()
    
    # 2. 画像ファイルの存在チェック
    print("2. 画像ファイルの存在チェック:")
    
    # backgrounds-data.tsで定義されているURL
    defined_urls = set(item['url'] for item in backgrounds_data if item['url'])
    
    # 存在しないファイル
    missing_files = defined_urls - set(actual_files)
    if missing_files:
        print(f"  ❌ backgrounds-data.tsで定義されているが、実際には存在しないファイル:")
        for url in sorted(missing_files):
            print(f"    - {url}")
    
    # 定義されていないファイル
    undefined_files = set(actual_files) - defined_urls
    if undefined_files:
        print(f"  ❌ 実際に存在するが、backgrounds-data.tsで定義されていないファイル:")
        for url in sorted(undefined_files):
            print(f"    - {url}")
    
    if not missing_files and not undefined_files:
        print("  ✅ すべてのファイルが正しく存在・定義されています")
    
    print()
    
    # 3. locationIdの整合性チェック
    print("3. locationIdの整合性チェック:")
    
    # backgrounds-data.tsのlocationIdセット
    bg_location_ids = set(item['locationId'] for item in backgrounds_data if item['locationId'])
    
    # location-background-map.tsのキーセット
    map_location_ids = set(location_map.keys())
    
    # マッピングされていないlocationId
    unmapped = bg_location_ids - map_location_ids
    if unmapped:
        print(f"  ❌ backgrounds-data.tsで使用されているが、location-background-map.tsでマッピングされていないlocationId:")
        for id in sorted(unmapped):
            print(f"    - {id}")
    
    # 使用されていないマッピング
    unused = map_location_ids - bg_location_ids
    if unused:
        print(f"  ❌ location-background-map.tsでマッピングされているが、使用されていないlocationId:")
        for id in sorted(unused):
            print(f"    - {id}")
    
    if not unmapped and not unused:
        print("  ✅ すべてのlocationIdが正しくマッピングされています")
    
    print()
    
    # 4. 重複チェック
    print("4. 重複チェック:")
    
    # 重複した画像ID
    id_counts = {}
    for item in backgrounds_data:
        id = item['id']
        id_counts[id] = id_counts.get(id, 0) + 1
    
    duplicate_ids = {id: count for id, count in id_counts.items() if count > 1}
    if duplicate_ids:
        print(f"  ❌ 重複している画像ID:")
        for id, count in duplicate_ids.items():
            print(f"    - {id} ({count}回)")
    
    # location-background-map.tsでの重複参照
    duplicate_refs = False
    for location, ids in location_map.items():
        if len(ids) != len(set(ids)):
            print(f"  ❌ location-background-map.tsで同じ画像IDが重複参照されています: {location}")
            duplicate_refs = True
    
    if not duplicate_ids and not duplicate_refs:
        print("  ✅ 重複はありません")
    
    print()
    
    # 5. 統計情報
    print("5. 統計情報:")
    print(f"  - backgrounds-data.tsで定義されている画像数: {len(backgrounds_data)}")
    print(f"  - 実際に存在する画像ファイル数: {len(actual_files)}")
    print(f"  - location-background-map.tsで定義されている場所数: {len(location_map)}")
    print(f"  - 参照されている画像ID数: {len(referenced_ids)}")

if __name__ == "__main__":
    check_consistency()