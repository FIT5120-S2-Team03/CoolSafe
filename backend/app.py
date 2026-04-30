from flask import Flask, jsonify, g
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
    return jsonify(HVI_DATA)


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
        {'id': r['id'], 'name': r['description'], 'lat': float(r['lat']), 'lng': float(r['lng'])}
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


if __name__ == '__main__':
    app.run(debug=True)
