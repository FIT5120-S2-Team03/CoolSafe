"""
Tree Canopies 2021 Seeding Script
Seeds tree_canopies table in Neon PostgreSQL

Usage:
    python3 seed_tree_canopies.py

Requirements:
    pip3 install geopandas psycopg2-binary
"""

import os

import geopandas as gpd
import psycopg2
from psycopg2.extras import execute_values
from shapely.geometry import MultiPolygon, Polygon

DATABASE_URL = os.environ["DATABASE_URL"]  # set via: export DATABASE_URL="postgresql://..."

# Path to the shapefile (relative to this script)
SHP_PATH = "tree-canopies-2021-urban-forest.shp"

# Batch size for inserts (avoids memory issues with 50k rows)
BATCH_SIZE = 500


def to_multipolygon(geom):
    """Convert Polygon to MultiPolygon for consistent storage."""
    if geom is None:
        return None
    if isinstance(geom, Polygon):
        return MultiPolygon([geom])
    return geom


def seed_tree_canopies():
    print("🌳 Loading Tree Canopies shapefile...")
    gdf = gpd.read_file(SHP_PATH)
    print(f"   Loaded {len(gdf)} records (already EPSG:4326, no reprojection needed)")

    # Convert all to MultiPolygon
    gdf["geometry"] = gdf["geometry"].apply(to_multipolygon)
    gdf = gdf[gdf["geometry"].notna()]
    print(f"   {len(gdf)} valid geometries after cleaning")

    conn = psycopg2.connect(DATABASE_URL)
    print("✅ Connected to Neon PostgreSQL")

    cur = conn.cursor()

    # Insert in batches
    total = len(gdf)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch = gdf.iloc[i:i + BATCH_SIZE]
        rows = [(row.geometry.wkt,) for _, row in batch.iterrows()]

        for (wkt,) in rows:
            cur.execute(
                "INSERT INTO tree_canopies (geom) VALUES (ST_GeomFromText(%s, 4326))",
                (wkt,)
            )

        conn.commit()
        inserted += len(rows)
        print(f"   Inserted {inserted}/{total}...")

    conn.close()
    print(f"\n🎉 Done! {inserted} tree canopy polygons inserted into tree_canopies table.")


if __name__ == "__main__":
    seed_tree_canopies()
