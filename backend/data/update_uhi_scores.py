"""
Update zone table with UHI scores from Heat Islands 2018 shapefile.
Matches each zone centroid to the Mesh Block it falls within.

Usage:
    python3 update_uhi_scores.py

Requirements:
    pip3 install geopandas psycopg2-binary shapely
"""

import geopandas as gpd
import psycopg2
from shapely.geometry import Point

# ============================================================
# 🔧 CHANGE THIS to your Neon connection string
# ============================================================
DATABASE_URL = "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

HEAT_SHP = "HEAT_URBAN_HEAT_2018.shp"


def update_uhi_scores():
    print("🌡️  Loading Heat Islands shapefile...")
    heat_gdf = gpd.read_file(HEAT_SHP)
    heat_gdf = heat_gdf.to_crs(epsg=4326)
    print(f"   {len(heat_gdf)} Mesh Block polygons loaded")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Fetch all zones with their centroids
    cur.execute("SELECT id, zone_name, lat, lng FROM zone")
    zones = cur.fetchall()
    print(f"   {len(zones)} zones to process\n")

    updated = 0
    not_found = []

    for zone_id, zone_name, lat, lng in zones:
        point = Point(float(lng), float(lat))

        # Find which Mesh Block contains this centroid
        containing = heat_gdf[heat_gdf.geometry.contains(point)]

        if len(containing) > 0:
            uhi_score = round(float(containing.iloc[0]['UHI18_M']), 2)
            cur.execute(
                "UPDATE zone SET uhi_score = %s WHERE id = %s",
                (uhi_score, zone_id)
            )
            print(f"   ✅ {zone_name}: {uhi_score}°C")
            updated += 1
        else:
            # Fallback: find nearest Mesh Block centroid
            heat_gdf['dist'] = heat_gdf.geometry.centroid.distance(point)
            nearest = heat_gdf.loc[heat_gdf['dist'].idxmin()]
            uhi_score = round(float(nearest['UHI18_M']), 2)
            cur.execute(
                "UPDATE zone SET uhi_score = %s WHERE id = %s",
                (uhi_score, zone_id)
            )
            print(f"   ⚠️  {zone_name}: {uhi_score}°C (nearest, no exact match)")
            not_found.append(zone_name)
            updated += 1

    conn.commit()
    conn.close()

    print(f"\n🎉 Done! {updated}/{len(zones)} zones updated")
    if not_found:
        print(f"   Used nearest match for: {', '.join(not_found)}")


if __name__ == "__main__":
    update_uhi_scores()
