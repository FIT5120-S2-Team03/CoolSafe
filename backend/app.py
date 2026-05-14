from flask import Flask, jsonify, g, request
from flask_cors import CORS
from dotenv import load_dotenv
import json
import os
import psycopg2
import psycopg2.extras

load_dotenv()

app = Flask(__name__)
CORS(app)

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


@app.route('/api/coolest-route')
def get_coolest_route():
    """
    Prototype Coolest Route API.

    This compares two sample walking route candidates:
    1. Fastest Route
    2. Coolest Route

    It uses the tree_canopies table in Neon PostGIS.
    Each route is buffered by 5 metres.
    Then PostGIS counts how many tree canopy polygons are near each route.
    """

    cur = get_db().cursor()

    cur.execute("""
        WITH routes AS (
          SELECT 
            'Fastest Route' AS route_name,
            ST_SetSRID(
              ST_MakeLine(ARRAY[
                ST_MakePoint(144.9631, -37.8136),
                ST_MakePoint(144.9640, -37.8145),
                ST_MakePoint(144.9650, -37.8155)
              ]),
              4326
            ) AS geom

          UNION ALL

          SELECT 
            'Coolest Route' AS route_name,
            ST_SetSRID(
              ST_MakeLine(ARRAY[
                ST_MakePoint(144.9631, -37.8136),
                ST_MakePoint(144.9626, -37.8142),
                ST_MakePoint(144.9620, -37.8150),
                ST_MakePoint(144.9630, -37.8160)
              ]),
              4326
            ) AS geom
        ),
        route_buffers AS (
          SELECT 
            route_name,
            geom,
            ST_Buffer(geom::geography, 5)::geometry AS buffer_geom
          FROM routes
        )
        SELECT 
          route_buffers.route_name,
          ROUND(ST_Length(route_buffers.geom::geography)::numeric, 2) AS total_length_m,
          COUNT(tree_canopies.id) AS nearby_canopy_count,
          COUNT(tree_canopies.id) * 10 AS shade_score
        FROM route_buffers
        LEFT JOIN tree_canopies 
          ON ST_Intersects(route_buffers.buffer_geom, tree_canopies.geom)
        GROUP BY route_buffers.route_name, route_buffers.geom
        ORDER BY shade_score DESC;
    """)

    rows = cur.fetchall()
    cur.close()

    routes = []
    for row in rows:
        routes.append({
            'route_name': row['route_name'],
            'total_length_m': float(row['total_length_m']),
            'nearby_canopy_count': int(row['nearby_canopy_count']),
            'shade_score': int(row['shade_score']),
        })

    recommended = routes[0]['route_name'] if routes else None

    return jsonify({
        'recommended': recommended,
        'routes': routes
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)