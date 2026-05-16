from flask import Flask, jsonify, g, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
import json
import os
import psycopg2
import psycopg2.extras

from shapely.geometry import LineString, shape
from shapely.ops import transform, unary_union
from pyproj import Transformer

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

DATABASE_URL = os.getenv('DATABASE_URL')

HVI_PATH = os.path.join(os.path.dirname(__file__), 'data', 'hvi_melbourne.geojson')
with open(HVI_PATH) as f:
    HVI_DATA = json.load(f)

DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

# Convert latitude/longitude coordinates into metre-based coordinates.
# This makes route length and shade buffer calculations more meaningful.
TO_METERS = Transformer.from_crs("EPSG:4326", "EPSG:7855", always_xy=True).transform


def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def fmt_time(t):
    if t is None:
        return None
    if hasattr(t, 'strftime'):
        return t.strftime('%H:%M')
    return str(t)[:5]


def day_name(d):
    if isinstance(d, int):
        return DAY_NAMES[d]
    return str(d)


def build_opening_hours(rows):
    hours = {}
    for row in rows:
        if row['day_of_week'] is not None and row['open_time'] is not None:
            hours[day_name(row['day_of_week'])] = {
                'open': fmt_time(row['open_time']),
                'close': fmt_time(row['close_time']),
            }
    return hours


@app.route('/api/hvi')
def get_hvi():
    response = jsonify(HVI_DATA)
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response


@app.route('/api/cool-spaces')
def get_cool_spaces():
    cur = get_db().cursor()
    cur.execute("""
        SELECT cs.id, cs.name, cs.category, cs.address, cs.suburb,
               cs.lat, cs.lng, cs.phone,
               oh.day_of_week, oh.open_time, oh.close_time
        FROM cool_spaces cs
        LEFT JOIN opening_hours oh ON oh.space_id = cs.id
        WHERE cs.is_active = true
        ORDER BY cs.id, oh.day_of_week
    """)
    rows = cur.fetchall()
    cur.close()

    venues = {}

    for row in rows:
        vid = row['id']

        if vid not in venues:
            venues[vid] = {
                'id': vid,
                'name': row['name'],
                'category': row['category'] or '',
                'address': row['address'] or '',
                'suburb': row['suburb'] or '',
                'lat': float(row['lat']),
                'lng': float(row['lng']),
                'phone': row['phone'] or '',
                'opening_hours': {},
            }

        if row['day_of_week'] is not None and row['open_time'] is not None:
            venues[vid]['opening_hours'][day_name(row['day_of_week'])] = {
                'open': fmt_time(row['open_time']),
                'close': fmt_time(row['close_time']),
            }

    return jsonify(list(venues.values()))


@app.route('/api/fountains')
def get_fountains():
    cur = get_db().cursor()
    cur.execute("SELECT id, description, lat, lng FROM drinking_fountains")
    rows = cur.fetchall()
    cur.close()

    return jsonify([
        {
            'id': r['id'],
            'name': r['description'],
            'lat': float(r['lat']),
            'lng': float(r['lng']),
            'category': 'Fountain'
        }
        for r in rows
    ])


@app.route('/api/venue/<int:venue_id>')
def get_venue(venue_id):
    cur = get_db().cursor()
    cur.execute("""
        SELECT cs.id, cs.name, cs.category, cs.address, cs.suburb,
               cs.lat, cs.lng, cs.phone,
               oh.day_of_week, oh.open_time, oh.close_time
        FROM cool_spaces cs
        LEFT JOIN opening_hours oh ON oh.space_id = cs.id
        WHERE cs.id = %s
        ORDER BY oh.day_of_week
    """, (venue_id,))

    rows = cur.fetchall()
    cur.close()

    if not rows:
        return jsonify({'error': 'Venue not found'}), 404

    venue = {
        'id': rows[0]['id'],
        'name': rows[0]['name'],
        'category': rows[0]['category'] or '',
        'address': rows[0]['address'] or '',
        'suburb': rows[0]['suburb'] or '',
        'lat': float(rows[0]['lat']),
        'lng': float(rows[0]['lng']),
        'phone': rows[0]['phone'] or '',
        'opening_hours': build_opening_hours(rows),
    }

    return jsonify(venue)


def calculate_shade_coverage(route_coords):
    """
    Calculate route shade coverage using Shapely.

    route_coords format from frontend:
    [
        [lat, lng],
        [lat, lng],
        ...
    ]

    Main logic:
    1. Convert route coordinates into a LineString.
    2. Find nearby tree canopy polygons from PostGIS.
    3. Convert geometry into metre-based coordinates.
    4. Calculate how much route length is close to tree canopy.
    5. Return shade coverage percentage.
    """

    if not route_coords or len(route_coords) < 2:
        return None

    lng_lat_points = []

    for point in route_coords:
        if len(point) >= 2:
            lat = float(point[0])
            lng = float(point[1])
            lng_lat_points.append((lng, lat))

    if len(lng_lat_points) < 2:
        return None

    route_line = LineString(lng_lat_points)

    cur = get_db().cursor()

    cur.execute("""
        WITH route AS (
            SELECT ST_SetSRID(ST_GeomFromText(%s), 4326) AS geom
        )
        SELECT ST_AsGeoJSON(tree_canopies.geom) AS geojson
        FROM tree_canopies, route
        WHERE ST_Intersects(
            tree_canopies.geom,
            ST_Buffer(route.geom::geography, 20)::geometry
        )
        LIMIT 5000;
    """, (route_line.wkt,))

    rows = cur.fetchall()
    cur.close()

    route_m = transform(TO_METERS, route_line)
    total_length_m = route_m.length

    if total_length_m == 0:
        return None

    canopy_shapes_m = []

    for row in rows:
        geojson_value = row['geojson']

        if isinstance(geojson_value, str):
            geojson_value = json.loads(geojson_value)

        canopy_geom = shape(geojson_value)
        canopy_geom_m = transform(TO_METERS, canopy_geom)
        canopy_shapes_m.append(canopy_geom_m)

    nearby_canopy_count = len(canopy_shapes_m)

    if nearby_canopy_count == 0:
        shaded_length_m = 0
        shade_coverage_percent = 0
    else:
        canopy_union = unary_union(canopy_shapes_m)

        # A 5 metre buffer means the route is counted as shaded
        # if it is close to tree canopy.
        shade_area = canopy_union.buffer(5)

        shaded_route = route_m.intersection(shade_area)
        shaded_length_m = shaded_route.length

        shade_coverage_percent = (shaded_length_m / total_length_m) * 100

        if shade_coverage_percent > 100:
            shade_coverage_percent = 100

    shade_score = round(shade_coverage_percent)

    return {
        'total_length_m': round(total_length_m, 2),
        'shaded_length_m': round(shaded_length_m, 2),
        'shade_coverage_percent': round(shade_coverage_percent, 1),
        'nearby_canopy_count': nearby_canopy_count,
        'shade_score': shade_score
    }


@app.route('/api/coolest-route', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def get_coolest_route():
    if request.method == 'OPTIONS':
        return '', 200
    """
    Dynamic Coolest Route API.

    GET:
    Uses a sample route for browser testing.

    POST:
    Receives real route coordinates from the frontend and calculates
    shade coverage percentage using Shapely.
    """

    if request.method == 'POST':
        data = request.get_json()
        route_coords = data.get('route_coords', []) if data else []
    else:
        # Sample route for quick browser testing only.
        route_coords = [
            [-37.8136, 144.9631],
            [-37.8142, 144.9626],
            [-37.8150, 144.9620],
            [-37.8160, 144.9630]
        ]

    result = calculate_shade_coverage(route_coords)

    if result is None:
        return jsonify({
            'error': 'Invalid route coordinates'
        }), 400

    return jsonify({
        'route_name': 'Coolest Route',
        'algorithm': 'Shapely shade coverage',
        'message': 'Shade coverage is calculated from the percentage of route length near tree canopy polygons.',
        'route': result
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)