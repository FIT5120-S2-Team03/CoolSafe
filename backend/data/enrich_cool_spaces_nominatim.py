"""
Nominatim → cool_spaces address/suburb enrichment script

Usage:
    python3 enrich_cool_spaces_nominatim.py

Requirements:
    pip3 install requests psycopg2-binary
"""

import requests
import psycopg2
import time

# ============================================================
# 🔧 CHANGE THIS to your Neon connection string
# ============================================================
DATABASE_URL = "postgresql://neondb_owner:npg_JOqe1RiXHc9Y@ep-dry-cloud-a7136g4i-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "CoolsafeApp/1.0 (student project)"}


def query_nominatim(name):
    """Search Nominatim by venue name, return address details."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "q": name,
                "format": "json",
                "addressdetails": 1,
                "countrycodes": "au",
                "limit": 1
            },
            headers=HEADERS,
            timeout=10
        )
        resp.raise_for_status()
        results = resp.json()

        if not results:
            return {}

        addr = results[0].get("address", {})
        display = results[0].get("display_name", "")

        # Build street address from house number + road
        house = addr.get("house_number", "")
        road = addr.get("road", "")
        address = f"{house} {road}".strip() or None

        suburb = addr.get("suburb") or addr.get("neighbourhood") or None

        return {"address": address, "suburb": suburb}

    except Exception as e:
        print(f"      Nominatim error: {e}")
        return {}


def enrich():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name FROM cool_spaces
        WHERE address IS NULL OR suburb IS NULL
        ORDER BY id
    """)
    spaces = cur.fetchall()
    print(f"🔍 {len(spaces)} cool spaces to enrich via Nominatim\n")

    updated = 0
    for i, (space_id, name) in enumerate(spaces):
        print(f"  [{i+1}/{len(spaces)}] {name}")

        result = query_nominatim(name)

        if any(result.values()):
            cur.execute("""
                UPDATE cool_spaces
                SET
                    address = COALESCE(address, %s),
                    suburb  = COALESCE(suburb,  %s)
                WHERE id = %s
            """, (result.get("address"), result.get("suburb"), space_id))
            conn.commit()
            updated += 1
            found = [k for k, v in result.items() if v]
            print(f"      ✅ {', '.join(found)}")
        else:
            print(f"      — no data found")

        # Nominatim 使用条款：最多 1 request/second
        time.sleep(1)

    conn.close()
    print(f"\n🎉 Done! {updated}/{len(spaces)} spaces enriched.")


if __name__ == "__main__":
    enrich()
