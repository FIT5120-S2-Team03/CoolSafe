"""
CoM Landmarks → cool_spaces Seeding Script
Fetches City of Melbourne Landmarks API and seeds cool_spaces table.

Usage:
    python3 seed_cool_spaces.py

Requirements:
    pip3 install requests psycopg2-binary
"""

import os

import requests
import psycopg2
from psycopg2.extras import execute_values
from datetime import date

DATABASE_URL = os.environ["DATABASE_URL"]  # set via: export DATABASE_URL="postgresql://..."

# CoM Landmarks API
API_URL = (
    "https://data.melbourne.vic.gov.au/api/v2/catalog/datasets/"
    "landmarks-and-places-of-interest-including-schools-theatres-health-services-spor/"
    "exports/geojson?limit=100&offset={offset}"
)

# sub_theme → category mapping (from DMP)
CATEGORY_MAPPING = {
    "Art Gallery/Museum": "Arts & Culture",
    "Theatre Live": "Arts & Culture",
    "Cinema": "Arts & Culture",
    "Library": "Learning",
    "Tertiary (University)": "Learning",
    "Further Education": "Learning",
    "Informal Outdoor Facility (Park/Garden/Reserve)": "Recreation",
    "Indoor Recreation Facility": "Recreation",
    "Major Sports & Recreation Facility": "Recreation",
    "Gymnasium/Health Club": "Recreation",
    "Aquarium": "Recreation",
    "Observation Tower/Wheel": "Recreation",
    "Outdoor Recreation Facility (Zoo, Golf Course)": "Recreation",
    "Public Buildings": "Community Support",
    "Public Hospital": "Community Support",
    "Visitor Centre": "Visitor Info",
    "Function/Conference/Exhibition Centre": "Visitor Info",
}

# Only import sub_themes that are in our mapping (cooling-relevant venues)
ALLOWED_SUB_THEMES = set(CATEGORY_MAPPING.keys())


def fetch_all_landmarks():
    """Fetch all landmarks from CoM API with pagination."""
    features = []
    offset = 0
    batch_size = 100

    print("🌐 Fetching landmarks from CoM API...")
    while True:
        url = API_URL.format(offset=offset)
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        batch = data.get("features", [])
        if not batch:
            break

        features.extend(batch)
        print(f"   Fetched {len(features)} records so far...")
        offset += batch_size

        # If batch is smaller than batch_size, we've reached the end
        if len(batch) < batch_size:
            break

    print(f"   Total fetched: {len(features)} features")
    return features


def parse_coordinates(co_ordinates):
    """
    Parse coordinates from GeoJSON geometry or co_ordinates string.
    Returns (lat, lng) or (None, None).
    """
    if co_ordinates is None:
        return None, None
    try:
        # GeoJSON geometry: [lng, lat]
        if isinstance(co_ordinates, dict):
            coords = co_ordinates.get("coordinates", [])
            if coords and len(coords) >= 2:
                return round(float(coords[1]), 6), round(float(coords[0]), 6)
        # String format: "lat, lng"
        if isinstance(co_ordinates, str):
            parts = co_ordinates.split(",")
            if len(parts) == 2:
                return round(float(parts[0].strip()), 6), round(float(parts[1].strip()), 6)
    except (ValueError, TypeError):
        pass
    return None, None


def seed_cool_spaces(conn, features):
    """Insert filtered landmarks into cool_spaces table."""
    rows = []
    skipped = 0

    for feature in features:
        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})

        sub_theme = props.get("sub_theme") or props.get("SUB_THEME") or ""
        name = props.get("feature_name") or props.get("FEATURE_NAME") or ""

        # Only keep venues relevant to cooling
        if sub_theme not in ALLOWED_SUB_THEMES:
            skipped += 1
            continue

        # Parse coordinates from geometry
        lat, lng = parse_coordinates(geometry)

        # Skip if no coordinates
        if lat is None or lng is None:
            skipped += 1
            continue

        category = CATEGORY_MAPPING.get(sub_theme, "Other")

        rows.append((
            None,           # zone_id — can be updated later via spatial join
            name,
            sub_theme,
            category,
            None,           # address — not in dataset
            None,           # suburb — not in dataset
            lat,
            lng,
            None,           # phone — not in dataset
            "City of Melbourne Landmarks",
            date.today(),
            True            # is_active
        ))

    print(f"   {len(rows)} venues to insert, {skipped} skipped (irrelevant sub_theme or missing coords)")

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO cool_spaces
              (zone_id, name, sub_theme, category, address, suburb,
               lat, lng, phone, data_source, last_updated, is_active)
            VALUES %s
        """, rows)
    conn.commit()
    print(f"   ✅ Inserted {len(rows)} cool spaces")


def main():
    print("🚀 CoM Landmarks → cool_spaces Seeding")
    print("=" * 40)

    conn = psycopg2.connect(DATABASE_URL)
    print("✅ Connected to Neon PostgreSQL\n")

    try:
        features = fetch_all_landmarks()
        seed_cool_spaces(conn, features)
    finally:
        conn.close()

    print("\n🎉 Done!")


if __name__ == "__main__":
    main()
