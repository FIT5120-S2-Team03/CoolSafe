"""
Drinking Fountains → cool_spaces Seeding Script

Usage:
    python3 seed_fountains.py

Requirements:
    pip3 install requests psycopg2-binary
"""

import requests
import psycopg2
from psycopg2.extras import execute_values
from datetime import date

# ============================================================
# 🔧 CHANGE THIS to your Neon connection string
# ============================================================
DATABASE_URL = "postgresql://neondb_owner:npg_JOqe1RiXHc9Y@ep-dry-cloud-a7136g4i-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

API_URL = "https://data.melbourne.vic.gov.au/api/v2/catalog/datasets/drinking-fountains/exports/geojson"


def seed_fountains():
    print("⛲ Fetching Drinking Fountains data...")
    resp = requests.get(API_URL, timeout=30)
    resp.raise_for_status()
    features = resp.json().get("features", [])
    print(f"   Found {len(features)} fountains")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Build rows
    rows = []
    for f in features:
        props = f.get("properties", {})
        lat = props.get("lat")
        lng = props.get("lon")
        if lat is None or lng is None:
            continue
        rows.append((
            None,                               # zone_id (filled below)
            "Drinking Fountain",                # name
            "Drinking Fountain",                # sub_theme
            "Fountain",                         # category
            None,                               # address
            None,                               # suburb
            round(float(lat), 6),               # lat
            round(float(lng), 6),               # lng
            None,                               # phone
            "City of Melbourne Drinking Fountains",  # data_source
            date.today(),                       # last_updated
            True                                # is_active
        ))

    print(f"   Inserting {len(rows)} fountains...")
    execute_values(cur, """
        INSERT INTO cool_spaces
          (zone_id, name, sub_theme, category, address, suburb,
           lat, lng, phone, data_source, last_updated, is_active)
        VALUES %s
    """, rows)
    conn.commit()
    print("   ✅ Inserted")

    # Fill zone_id via spatial join
    print("   Filling zone_id via spatial join...")
    cur.execute("""
        UPDATE cool_spaces cs
        SET zone_id = z.id
        FROM zone z
        WHERE cs.zone_id IS NULL
          AND cs.sub_theme = 'Drinking Fountain'
          AND ST_Within(
            ST_SetSRID(ST_MakePoint(cs.lng, cs.lat), 4326),
            ST_GeomFromGeoJSON(z.geojson_polygon)
          )
    """)
    conn.commit()
    print(f"   ✅ zone_id updated for {cur.rowcount} fountains")

    conn.close()
    print("\n🎉 Done!")


if __name__ == "__main__":
    seed_fountains()
