from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Load HVI GeoJSON once at startup
HVI_PATH = os.path.join(os.path.dirname(__file__), 'data', 'hvi_melbourne.geojson')
with open(HVI_PATH) as f:
    HVI_DATA = json.load(f)

@app.route('/api/hvi')
def get_hvi():
    return jsonify(HVI_DATA)

if __name__ == '__main__':
    app.run(debug=True)