from flask import request, Flask, jsonify


import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAIN_DIR = os.path.dirname(SCRIPT_DIR)
PROJECT_ROOT = os.path.dirname(os.path.dirname(MAIN_DIR))

sys.path.append(os.path.dirname(SCRIPT_DIR))

from services.spotify.service import *

app = Flask(__name__)
spotify_service = SpotifyService()

@app.route('/spotify/start-monitoring', methods=['POST'])
async def start_monitoring():
    result = await spotify_service.start_monitoring()
    return jsonify(result)

@app.route('/spotify/stop-monitoring', methods=['POST'])
async def stop_monitoring():
    result = await spotify_service.stop_monitoring()
    return jsonify(result)

@app.route('/spotify/playback-state', methods=['GET'])
def get_playback_state():
    result = spotify_service.get_playback_state()
    return jsonify(result)

@app.route('/spotify/current-track', methods=['GET'])
def get_current_track():
    result = spotify_service.get_current_track()
    return jsonify(result)

@app.route('/spotify/next-track', methods=['POST'])
def next_track():
    result = spotify_service.next_track()
    return jsonify(result)

@app.route('/spotify/previous-track', methods=['POST'])
def previous_track():
    result = spotify_service.previous_track()
    return jsonify(result)

@app.route('/spotify/pause', methods=['POST'])
def pause_playback():
    result = spotify_service.pause_playback()
    return jsonify(result)

@app.route('/spotify/play', methods=['POST'])
def start_playback():
    result = spotify_service.start_playback()
    return jsonify(result)

@app.route('/spotify/lyrics', methods=['GET'])
def get_lyrics():
    result = spotify_service.get_lyrics()
    return jsonify(result)

@app.route('/spotify/token', methods=['GET'])
def get_spotify_token():
    result = spotify_service.get_spotify_token()
    return jsonify(result)


@app.route('/spotify/volume', methods=['POST'])
def set_volume():
    try:
        # Get volume from request body
        data = request.get_json()
        
        if not data or 'volume' not in data:
            return jsonify({'error': 'Volume parameter is required'}), 400
            
        volume = data['volume']
        
        # Validate volume value
        if not isinstance(volume, (int, float)) or volume < 0 or volume > 100:
            return jsonify({'error': 'Volume must be a number between 0 and 100'}), 400
            
        # Call the service method
        result = spotify_service.set_volume(int(volume))
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=20000)