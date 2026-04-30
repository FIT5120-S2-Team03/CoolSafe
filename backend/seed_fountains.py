"""
One-time script: creates drinking_fountains table in Neon and imports
data from backend/data/drinking-fountains.geojson.

Run once from the backend/ directory:
    python seed_fountains.py
"""

import json
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

GEOJSON_PATH = os.path.join(os.path.dirname(__file__), 'data', 'drinking-fountains.geojson')


def seed():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS drinking_fountains (
            id SERIAL PRIMARY KEY,
            description TEXT,
            lat DOUBLE PRECISION NOT NULL,
            lng DOUBLE PRECISION NOT NULL
        )
    """)

    cur.execute("SELECT COUNT(*) FROM drinking_fountains")
    if cur.fetchone()[0] > 0:
        print("Table already seeded, skipping.")
        cur.close()
        conn.close()
        return

    with open(GEOJSON_PATH) as f:
        data = json.load(f)

    records = [
        (
            feat['properties']['description'],
            feat['properties']['lat'],
            feat['properties']['lon'],
        )
        for feat in data['features']
    ]

    cur.executemany(
        "INSERT INTO drinking_fountains (description, lat, lng) VALUES (%s, %s, %s)",
        records,
    )

    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted {len(records)} drinking fountains.")


if __name__ == '__main__':
    seed()
