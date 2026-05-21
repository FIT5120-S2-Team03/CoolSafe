#!/usr/bin/env python3
"""
prepare_hvi.py — preprocess the AURIN Heat Vulnerability Index GeoJSON
for use as the static backend file served by /api/hvi.

Usage:
    cd backend/data
    python prepare_hvi.py hvi_sa1_source.geojson

Source:
    https://data.aurin.org.au/dataset/hvi_cityofgreatermelbourne_sa1_2021
    (free account required). Download the GeoJSON and pass its path as the argument.

Output:
    backend/data/hvi_melbourne.geojson  (overwritten in-place)

What it does:
    1. Keeps only the 'hvi' integer field (drops all other attributes).
    2. Simplifies geometry (Douglas-Peucker, tolerance ~50 m) to reduce file
       size while preserving suburb-level choropleth accuracy.
    3. Drops features whose geometry becomes empty after simplification.
    4. Writes compact GeoJSON without a CRS declaration (implies WGS84 per
       the GeoJSON spec). The AURIN source is GDA94 (EPSG:4283); the offset
       vs WGS84 is under 1 m, negligible for a choropleth overlay.

Expected output: ~10,000 features, ~4-5 MB, each feature with only {"hvi": int}.
"""

import json
import pathlib
import sys

from shapely.geometry import mapping, shape

TOLERANCE = 0.0005  # degrees, approx 50 m — reduces file size, fine for suburb polygons
OUT_PATH = pathlib.Path(__file__).parent / "hvi_melbourne.geojson"


def main(source_path: str) -> None:
    print(f"Reading {source_path} ...")
    with open(source_path) as f:
        src = json.load(f)

    features_in = src.get("features", [])
    print(f"  {len(features_in)} features in source")

    features_out = []
    skipped = 0
    for feat in features_in:
        hvi_val = feat["properties"].get("hvi")
        geom = shape(feat["geometry"]).simplify(TOLERANCE, preserve_topology=True)
        if geom.is_empty:
            skipped += 1
            continue
        features_out.append({
            "type": "Feature",
            "geometry": mapping(geom),
            "properties": {"hvi": hvi_val},
        })

    print(f"  {len(features_out)} features written ({skipped} dropped — empty after simplification)")

    out = {"type": "FeatureCollection", "features": features_out}
    with open(OUT_PATH, "w") as f:
        json.dump(out, f, separators=(",", ":"))

    size_mb = OUT_PATH.stat().st_size / 1_048_576
    print(f"Wrote {OUT_PATH} ({size_mb:.1f} MB)")

    print("\nValidation:")
    hvi_vals = {f["properties"]["hvi"] for f in features_out}
    print(f"  HVI range: {min(hvi_vals)} – {max(hvi_vals)}")
    print(f"  Property keys: {set(features_out[0]['properties'].keys())}")
    print("  GET /api/hvi should now return this file (restart backend if running).")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <source.geojson>")
        sys.exit(1)
    main(sys.argv[1])
