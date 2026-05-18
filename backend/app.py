from flask import Flask, jsonify, g, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
import json
import os
import psycopg2
import psycopg2.extras
from urllib import error as urllib_error
from urllib import request as urllib_request

from shapely.geometry import LineString

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

DATABASE_URL = os.getenv('DATABASE_URL')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

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


@app.route('/api/ai/recommend', methods=['POST', 'OPTIONS'])
@cross_origin()
def recommend_with_ai():
    if request.method == 'OPTIONS':
        return '', 200

    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured.'}), 500

    data = request.get_json(silent=True) or {}
    prompt = data.get('prompt')

    if not isinstance(prompt, str) or not prompt.strip():
        return jsonify({'error': 'prompt must be a non-empty string'}), 400

    endpoint = (
        'https://generativelanguage.googleapis.com/v1beta/models/'
        f'gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}'
    )
    payload = json.dumps({
        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        'tools': [{'google_search': {}}],
        'generationConfig': {'temperature': 0.5},
    }).encode('utf-8')

    upstream_request = urllib_request.Request(
        endpoint,
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib_request.urlopen(upstream_request, timeout=30) as response:
            response_body = response.read().decode('utf-8')
            return jsonify(json.loads(response_body))
    except urllib_error.HTTPError as exc:
        try:
            upstream_body = json.loads(exc.read().decode('utf-8'))
            upstream_message = upstream_body.get('error', {}).get('message')
        except (UnicodeDecodeError, json.JSONDecodeError):
            upstream_message = None

        return jsonify({
            'error': upstream_message or f'Gemini API error: {exc.code}'
        }), 502
    except (urllib_error.URLError, TimeoutError):
        return jsonify({'error': 'Unable to reach Gemini API.'}), 502
    except json.JSONDecodeError:
        return jsonify({'error': 'Gemini API returned invalid JSON.'}), 502


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


def calculate_shade_coverage_batch(routes):
    valid_routes = []

    for route in routes:
        coords = route.get('coords', []) if isinstance(route, dict) else []
        distance_m = route.get('distance_m') if isinstance(route, dict) else None

        if not coords or len(coords) < 2:
            continue

        lng_lat_points = []

        try:
            for point in coords:
                if len(point) < 2:
                    raise ValueError
                lat = float(point[0])
                lng = float(point[1])
                lng_lat_points.append((lng, lat))
        except (TypeError, ValueError):
            continue

        if len(lng_lat_points) < 2:
            continue

        route_line = LineString(lng_lat_points)

        if route_line.is_empty or route_line.length == 0:
            continue

        try:
            parsed_distance_m = float(distance_m)
        except (TypeError, ValueError):
            parsed_distance_m = None

        valid_routes.append({
            'coords': coords,
            'distance_m': parsed_distance_m,
            'wkt': route_line.wkt,
        })

    if not valid_routes:
        return []

    cur = get_db().cursor()
    cur.execute("""
        WITH input_routes AS (
            SELECT
                route_index,
                ST_SetSRID(ST_GeomFromText(route_wkt), 4326) AS geom
            FROM unnest(%s::text[]) WITH ORDINALITY AS routes(route_wkt, route_index)
        ),
        nearby_canopies AS (
            SELECT
                input_routes.route_index,
                tree_canopies.geom
            FROM input_routes
            JOIN tree_canopies
              ON ST_Intersects(
                  tree_canopies.geom,
                  ST_Buffer(input_routes.geom::geography, 20)::geometry
              )
        ),
        canopy_stats AS (
            SELECT
                input_routes.route_index,
                COUNT(nearby_canopies.geom) AS nearby_canopy_count
            FROM input_routes
            LEFT JOIN nearby_canopies
              ON nearby_canopies.route_index = input_routes.route_index
            GROUP BY input_routes.route_index
        ),
        clipped_segments AS (
            SELECT
                nearby_canopies.route_index,
                ST_Intersection(
                    input_routes.geom,
                    ST_Buffer(nearby_canopies.geom::geography, 5)::geometry
                ) AS geom
            FROM nearby_canopies
            JOIN input_routes
              ON input_routes.route_index = nearby_canopies.route_index
        ),
        merged_segments AS (
            SELECT
                route_index,
                ST_UnaryUnion(ST_Collect(geom)) AS geom
            FROM clipped_segments
            WHERE NOT ST_IsEmpty(geom)
            GROUP BY route_index
        )
        SELECT
            input_routes.route_index,
            ST_Length(input_routes.geom::geography) AS total_length_m,
            COALESCE(ST_Length(merged_segments.geom::geography), 0) AS shaded_length_m,
            canopy_stats.nearby_canopy_count
        FROM input_routes
        JOIN canopy_stats
          ON canopy_stats.route_index = input_routes.route_index
        LEFT JOIN merged_segments
          ON merged_segments.route_index = input_routes.route_index
        ORDER BY input_routes.route_index;
    """, ([route['wkt'] for route in valid_routes],))

    rows = cur.fetchall()
    cur.close()

    scored_routes = []

    for row in rows:
        route_index = int(row['route_index']) - 1
        source_route = valid_routes[route_index]
        total_length_m = float(row['total_length_m']) if row['total_length_m'] is not None else 0
        shaded_length_m = float(row['shaded_length_m']) if row['shaded_length_m'] is not None else 0
        shade_coverage_percent = min((shaded_length_m / total_length_m) * 100, 100) if total_length_m else 0

        scored_routes.append({
            'coords': source_route['coords'],
            'distance_m': round(source_route['distance_m'], 2) if source_route['distance_m'] is not None else round(total_length_m, 2),
            'total_length_m': round(total_length_m, 2),
            'shaded_length_m': round(shaded_length_m, 2),
            'shade_coverage_percent': round(shade_coverage_percent, 1),
            'nearby_canopy_count': int(row['nearby_canopy_count'] or 0),
            'shade_score': round(shade_coverage_percent),
        })

    return scored_routes


def select_coolest_route(scored_routes):
    if not scored_routes:
        return None

    selected_route_index = 0
    fastest_route = scored_routes[0]
    fastest_distance_m = fastest_route['distance_m']

    for index, route in enumerate(scored_routes[1:], start=1):
        distance_is_acceptable = route['distance_m'] <= fastest_distance_m * 1.20
        shade_is_better = route['shade_coverage_percent'] > fastest_route['shade_coverage_percent']

        if distance_is_acceptable and shade_is_better:
            selected_route_index = index
            fastest_route = route

    return selected_route_index


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
    Receives candidate routes from the frontend, scores them in one batch,
    and returns the coolest acceptable route.
    """

    if request.method == 'POST':
        data = request.get_json()
        routes = data.get('routes', []) if data else []
        routes_are_similar = bool(data.get('routes_are_similar')) if data else False
    else:
        # Sample route for quick browser testing only.
        routes = [
            {
                'coords': [
                    [-37.8136, 144.9631],
                    [-37.8142, 144.9626],
                    [-37.8150, 144.9620],
                    [-37.8160, 144.9630]
                ],
                'distance_m': 325
            }
        ]
        routes_are_similar = False

    if not isinstance(routes, list):
        return jsonify({'error': 'routes must be a list'}), 400

    candidates = calculate_shade_coverage_batch(routes[:3])
    selected_route_index = select_coolest_route(candidates)

    if selected_route_index is None:
        return jsonify({'error': 'No valid routes provided'}), 400

    selected_route = candidates[selected_route_index]

    return jsonify({
        'route_name': 'Coolest Route',
        'algorithm': 'Candidate reranking with PostGIS shade coverage',
        'message': 'The selected route is the shadiest acceptable candidate within 120% of the fastest route distance.',
        'fastest_route_index': 0,
        'selected_route_index': selected_route_index,
        'routes_are_similar': routes_are_similar,
        'same_as_fastest': selected_route_index == 0,
        'candidates': candidates,
        'route': selected_route
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)
