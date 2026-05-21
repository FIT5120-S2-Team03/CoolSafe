"""
OSM Overpass API → cool_spaces address/suburb/phone enrichment script

Usage:
    python3 enrich_cool_spaces_osm.py

Requirements:
    pip3 install requests psycopg2-binary
"""

import os

import requests
import psycopg2
import time

DATABASE_URL = os.environ["DATABASE_URL"]  # set via: export DATABASE_URL="postgresql://..."

OVERPASS_URL = "https://overpass.private.coffee/api/interpreter"
SEARCH_RADIUS = 100  # metres


def query_osm(lat, lng, name):
    query = f"""[out:json][timeout:15];
(
  node(around:{SEARCH_RADIUS},{lat},{lng});
  way(around:{SEARCH_RADIUS},{lat},{lng});
);
out tags;"""

    try:
        resp = requests.post(
            OVERPASS_URL,
            data=query,
            headers={"Content-Type": "text/plain"},
            timeout=20
        )
        resp.raise_for_status()
        elements = resp.json().get("elements", [])

        if not elements:
            return {}

        # Try name match first
        best = None
        name_lower = (name or "").lower()
        for el in elements:
            tags = el.get("tags", {})
            osm_name = (tags.get("name") or "").lower()
            if name_lower and osm_name and name_lower in osm_name:
                best = tags
                break

        # Fall back to first element with address info
        if not best:
            for el in elements:
                tags = el.get("tags", {})
                if any(k.startswith("addr:") for k in tags):
                    best = tags
                    break

        if not best:
            return {}

        house_number = best.get("addr:housenumber", "")
        street = best.get("addr:street", "")
        address = f"{house_number} {street}".strip() or None
        suburb = best.get("addr:suburb") or best.get("addr:city") or None
        phone = best.get("phone") or best.get("contact:phone") or None

        return {"address": address, "suburb": suburb, "phone": phone}

    except Exception as e:
        print(f"      OSM error: {e}")
        return {}


def enrich():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, lat, lng FROM cool_spaces
        WHERE address IS NULL OR suburb IS NULL OR phone IS NULL
        ORDER BY id
    """)
    spaces = cur.fetchall()
    print(f"🔍 {len(spaces)} cool spaces to enrich via OSM\n")

    updated = 0
    for i, (space_id, name, lat, lng) in enumerate(spaces):
        print(f"  [{i+1}/{len(spaces)}] {name}")

        result = query_osm(lat, lng, name)

        if any(result.values()):
            cur.execute("""
                UPDATE cool_spaces
                SET
                    address = COALESCE(address, %s),
                    suburb  = COALESCE(suburb,  %s),
                    phone   = COALESCE(phone,   %s)
                WHERE id = %s
            """, (result.get("address"), result.get("suburb"), result.get("phone"), space_id))
            conn.commit()
            updated += 1
            found = [k for k, v in result.items() if v]
            print(f"      ✅ {', '.join(found)}")
        else:
            print(f"      — no data found")

        time.sleep(1)

    conn.close()
    print(f"\n🎉 Done! {updated}/{len(spaces)} spaces enriched.")


if __name__ == "__main__":
    enrich()
