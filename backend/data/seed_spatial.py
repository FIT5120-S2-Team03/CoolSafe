"""
Coolsafe Spatial Data Seeding Script
Seeds Urban Heat Islands 2018 and Postcode Polygon into Neon PostgreSQL

Usage:
    pip install geopandas psycopg2-binary sqlalchemy geoalchemy2
    python seed_spatial.py
"""

import geopandas as gpd
import psycopg2
from psycopg2.extras import execute_values
from shapely.geometry import mapping
import json

# ============================================================
# 🔧 CHANGE THIS to your Neon connection string
# ============================================================
DATABASE_URL = "postgresql://neondb_owner:npg_JOqe1RiXHc9Y@ep-dry-cloud-a7136g4i-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ============================================================
# File paths (relative to this script)
# ============================================================
HEAT_SHP = "HEAT_URBAN_HEAT_2018.shp"
POSTCODE_SHP = "POSTCODE_POLYGON.shp"

# UHI18_M threshold: zones with value above this are flagged as vulnerability zones
# Based on DMP: cross-reference Urban Heat Island classification
UHI_VULNERABILITY_THRESHOLD = 5.0


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def seed_zone_from_postcode(conn):
    """
    Seeds zone table from Postcode Polygon shapefile.
    Stores postcode, centroid lat/lng, and polygon as GeoJSON text.
    """
    print("📍 Loading Postcode Polygon shapefile...")
    gdf = gpd.read_file(POSTCODE_SHP)

    # Reproject from GDA2020 (EPSG:7844) to WGS84 (EPSG:4326)
    gdf = gdf.to_crs(epsg=4326)

    # Calculate centroids
    gdf["centroid"] = gdf.geometry.centroid
    gdf["lat"] = gdf["centroid"].y
    gdf["lng"] = gdf["centroid"].x

    rows = []
    for _, row in gdf.iterrows():
        postcode = str(row["POSTCODE"]).zfill(4)
        lat = round(row["lat"], 6)
        lng = round(row["lng"], 6)
        geojson_polygon = json.dumps(mapping(row["geometry"]))

        rows.append((
            postcode,
            postcode,       # zone_code = postcode
            postcode,       # zone_name = postcode (no locality name in this dataset)
            lat,
            lng,
            False,          # is_vulnerability_zone — updated in next step
            geojson_polygon
        ))

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO zone (postcode, zone_code, zone_name, lat, lng, is_vulnerability_zone, geojson_polygon)
            VALUES %s
        """, rows)
    conn.commit()
    print(f"   ✅ Inserted {len(rows)} postcode zones")


def update_vulnerability_zones(conn):
    """
    Cross-references each zone centroid against Urban Heat Island polygons.
    Zones whose centroid falls inside a UHI zone with UHI18_M > threshold
    are flagged as is_vulnerability_zone = true.
    """
    print("🌡️  Loading Urban Heat Islands shapefile...")
    heat_gdf = gpd.read_file(HEAT_SHP)
    heat_gdf = heat_gdf.to_crs(epsg=4326)

    # Only keep high-heat zones
    high_heat = heat_gdf[heat_gdf["UHI18_M"] > UHI_VULNERABILITY_THRESHOLD].copy()
    print(f"   Found {len(high_heat)} high-heat zones (UHI18_M > {UHI_VULNERABILITY_THRESHOLD})")

    # Load zone centroids from DB
    with conn.cursor() as cur:
        cur.execute("SELECT id, lat, lng FROM zone")
        zones = cur.fetchall()

    print(f"   Checking {len(zones)} postcode zones against heat islands...")

    # Build GeoDataFrame from zone centroids
    from shapely.geometry import Point
    import geopandas as gpd2

    zone_points = gpd.GeoDataFrame(
        [{"id": z[0], "geometry": Point(z[2], z[1])} for z in zones],
        crs="EPSG:4326"
    )

    # Spatial join: which zone centroids fall inside high-heat polygons?
    joined = gpd.sjoin(zone_points, high_heat[["geometry"]], how="left", predicate="within")
    vulnerable_ids = joined[joined["index_right"].notna()]["id"].tolist()

    print(f"   {len(vulnerable_ids)} zones flagged as vulnerability zones")

    with conn.cursor() as cur:
        if vulnerable_ids:
            cur.execute(
                "UPDATE zone SET is_vulnerability_zone = true WHERE id = ANY(%s)",
                (vulnerable_ids,)
            )
        cur.execute(
            "UPDATE zone SET is_vulnerability_zone = false WHERE id != ALL(%s)",
            (vulnerable_ids if vulnerable_ids else [-1],)
        )
    conn.commit()
    print("   ✅ Vulnerability zone flags updated")


def seed_tree_canopies(conn):
    """
    Seeds tree_canopies table from Tree Canopies 2021 GeoJSON.
    Place the GeoJSON file at: tree-canopies-2021-urban-forest.geojson
    """
    import os
    geojson_path = "tree-canopies-2021-urban-forest.geojson"

    if not os.path.exists(geojson_path):
        print(f"⚠️  Tree Canopies GeoJSON not found at '{geojson_path}' — skipping.")
        print("   Download from: https://data.melbourne.vic.gov.au/explore/dataset/tree-canopies-2021-urban-forest/")
        return

    print("🌳 Loading Tree Canopies GeoJSON...")
    gdf = gpd.read_file(geojson_path)
    gdf = gdf.to_crs(epsg=4326)

    # Force all geometries to MultiPolygon for consistent storage
    from shapely.geometry import MultiPolygon, Polygon

    def to_multipolygon(geom):
        if geom is None:
            return None
        if isinstance(geom, Polygon):
            return MultiPolygon([geom])
        return geom

    gdf["geometry"] = gdf["geometry"].apply(to_multipolygon)
    gdf = gdf[gdf["geometry"].notna()]

    rows = [(row.geometry.wkt,) for _, row in gdf.iterrows()]

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO tree_canopies (geom)
            VALUES (ST_GeomFromText(%s, 4326))
        """, rows, template="(%s)")
    conn.commit()
    print(f"   ✅ Inserted {len(rows)} tree canopy polygons")


def main():
    print("🚀 Coolsafe Spatial Data Seeding")
    print("=" * 40)

    conn = get_connection()
    print("✅ Connected to Neon PostgreSQL\n")

    try:
        seed_zone_from_postcode(conn)
        update_vulnerability_zones(conn)
        seed_tree_canopies(conn)
    finally:
        conn.close()

    print("\n🎉 Seeding complete!")


if __name__ == "__main__":
    main()
