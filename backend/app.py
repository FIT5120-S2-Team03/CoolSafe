from flask import Flask, jsonify, g, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
import json
import os
import psycopg2
import psycopg2.extras

from shapely.geometry import LineString

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

DATABASE_URL = os.getenv('DATABASE_URL')

HVI_PATH = os.path.join(os.path.dirname(__file__), 'data', 'hvi_melbourne.geojson')
with open(HVI_PATH) as f:
    HVI_DATA = json.load(f)

DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
    2. Let PostGIS find nearby tree canopy polygons.
    3. Clip the route against 5 metre canopy buffers in SQL.
    4. Merge only the clipped route segments so overlaps are not double-counted.
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

    # Keep the heavy spatial work inside PostGIS instead of materialising
    # thousands of canopy polygons in the Flask worker. The previous Python
    # path fetched up to 5000 polygons, projected each one, then ran
    # unary_union() on the whole set; on Render's 512 MB instances that can
    # exhaust the web process before a response is sent.
    cur.execute("""
        WITH route AS (
            SELECT ST_SetSRID(ST_GeomFromText(%s), 4326) AS geom
        ),
        nearby_canopies AS (
            SELECT tc.geom
            FROM tree_canopies tc, route
            WHERE ST_Intersects(
                tc.geom,
                ST_Buffer(route.geom::geography, 20)::geometry
            )
        ),
        canopy_stats AS (
            SELECT COUNT(*) AS nearby_canopy_count
            FROM nearby_canopies
        ),
        clipped_segments AS (
            SELECT ST_Intersection(
                route.geom,
                ST_Buffer(nearby_canopies.geom::geography, 5)::geometry
            ) AS geom
            FROM nearby_canopies, route
        ),
        merged_segments AS (
            SELECT
                ST_UnaryUnion(ST_Collect(geom)) AS geom
            FROM clipped_segments
            WHERE NOT ST_IsEmpty(geom)
        )
        SELECT
            ST_Length(route.geom::geography) AS total_length_m,
            COALESCE(ST_Length(merged_segments.geom::geography), 0) AS shaded_length_m,
            canopy_stats.nearby_canopy_count AS nearby_canopy_count
        FROM route
        CROSS JOIN canopy_stats
        LEFT JOIN merged_segments ON TRUE;
    """, (route_line.wkt,))

    row = cur.fetchone()
    cur.close()

    total_length_m = float(row['total_length_m']) if row and row['total_length_m'] is not None else 0

    if total_length_m == 0:
        return None

    shaded_length_m = float(row['shaded_length_m']) if row and row['shaded_length_m'] is not None else 0
    nearby_canopy_count = int(row['nearby_canopy_count']) if row and row['nearby_canopy_count'] is not None else 0
    shade_coverage_percent = min((shaded_length_m / total_length_m) * 100, 100)

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
