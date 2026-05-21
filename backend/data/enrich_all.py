"""
Nominatim → cool_spaces + opening_hours enrichment script
Fetches address, suburb, and opening hours for all cool_spaces in one pass.

Usage:
    python3 enrich_all.py

Requirements:
    pip3 install requests psycopg2-binary
"""

import os

import requests
import psycopg2
import time
import re

DATABASE_URL = os.environ["DATABASE_URL"]  # set via: export DATABASE_URL="postgresql://..."

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "CoolsafeApp/1.0 (student project)"}

DAY_MAP = {
    "Mo": "Monday",
    "Tu": "Tuesday",
    "We": "Wednesday",
    "Th": "Thursday",
    "Fr": "Friday",
    "Sa": "Saturday",
    "Su": "Sunday",
}

ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def expand_day_range(day_range):
    """Expand 'Mo-Fr' into ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']."""
    if "-" in day_range:
        parts = day_range.split("-")
        if len(parts) == 2:
            keys = list(DAY_MAP.keys())
            start = keys.index(parts[0]) if parts[0] in keys else 0
            end = keys.index(parts[1]) if parts[1] in keys else 6
            return [DAY_MAP[keys[i]] for i in range(start, end + 1)]
    return [DAY_MAP.get(day_range, day_range)]


def parse_opening_hours(oh_str):
    """
    Parse OSM opening_hours string into list of (day_of_week, open_time, close_time).
    Handles formats like:
      - 'Mo-Fr 09:00-17:00'
      - 'Mo-Fr 09:00-17:00; Sa 10:00-14:00'
      - '24/7'
    """
    if not oh_str:
        return []

    rows = []

    # Handle 24/7
    if oh_str.strip() == "24/7":
        for day in ALL_DAYS:
            rows.append((day, "00:00", "23:59"))
        return rows

    # Split by semicolon for multiple rules
    rules = [r.strip() for r in oh_str.split(";")]

    for rule in rules:
        if not rule:
            continue

        # Match pattern: day_spec time_range
        # e.g. "Mo-Fr 09:00-17:00" or "Sa,Su 10:00-16:00"
        match = re.match(
            r'^([A-Za-z,\-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$',
            rule.strip()
        )
        if not match:
            # Try notes like "off" — skip
            continue

        day_spec = match.group(1)
        open_time = match.group(2)
        close_time = match.group(3)

        # Handle comma-separated days: "Mo,We,Fr"
        day_parts = day_spec.split(",")
        days = []
        for part in day_parts:
            days.extend(expand_day_range(part))

        for day in days:
            rows.append((day, open_time, close_time))

    return rows


def query_nominatim(name):
    """Query Nominatim for address, suburb, and opening_hours."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "q": name,
                "format": "json",
                "addressdetails": 1,
                "extratags": 1,
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

        result = results[0]
        addr = result.get("address", {})
        extratags = result.get("extratags", {})

        house = addr.get("house_number", "")
        road = addr.get("road", "")
        address = f"{house} {road}".strip() or None
        suburb = addr.get("suburb") or addr.get("neighbourhood") or None
        opening_hours = extratags.get("opening_hours") or None

        return {
            "address": address,
            "suburb": suburb,
            "opening_hours": opening_hours
        }

    except Exception as e:
        print(f"      Nominatim error: {e}")
        return {}


def enrich():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name FROM cool_spaces
        ORDER BY id
    """)
    spaces = cur.fetchall()
    print(f"🔍 {len(spaces)} cool spaces to enrich\n")

    address_updated = 0
    hours_inserted = 0

    for i, (space_id, name) in enumerate(spaces):
        print(f"  [{i+1}/{len(spaces)}] {name}")

        result = query_nominatim(name)

        if not result:
            print(f"      — no data found")
            time.sleep(1)
            continue

        # Update address + suburb
        if result.get("address") or result.get("suburb"):
            cur.execute("""
                UPDATE cool_spaces
                SET
                    address = COALESCE(address, %s),
                    suburb  = COALESCE(suburb,  %s)
                WHERE id = %s
            """, (result.get("address"), result.get("suburb"), space_id))
            address_updated += 1

        # Parse and insert opening hours
        oh_str = result.get("opening_hours")
        if oh_str:
            parsed = parse_opening_hours(oh_str)
            if parsed:
                # Remove existing hours for this space first (avoid duplicates)
                cur.execute("DELETE FROM opening_hours WHERE space_id = %s", (space_id,))

                for (day, open_time, close_time) in parsed:
                    cur.execute("""
                        INSERT INTO opening_hours (space_id, day_of_week, open_time, close_time)
                        VALUES (%s, %s, %s, %s)
                    """, (space_id, day, open_time, close_time))
                    hours_inserted += 1

                print(f"      ✅ address/suburb + {len(parsed)} opening hour rows")
            else:
                print(f"      ✅ address/suburb | opening_hours unparseable: '{oh_str}'")
        else:
            found = [k for k, v in result.items() if v and k != "opening_hours"]
            print(f"      ✅ {', '.join(found) if found else 'nothing useful'}")

        conn.commit()
        time.sleep(1)

    conn.close()
    print(f"\n🎉 Done!")
    print(f"   address/suburb updated: {address_updated}")
    print(f"   opening_hours rows inserted: {hours_inserted}")


if __name__ == "__main__":
    enrich()
