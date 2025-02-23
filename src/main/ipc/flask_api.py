from flask import request, Flask, jsonify
from flask_cors import CORS
import asyncio
import threading
monitor_thread = None

import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAIN_DIR = os.path.dirname(SCRIPT_DIR)
PROJECT_ROOT = os.path.dirname(os.path.dirname(MAIN_DIR))

sys.path.append(os.path.dirname(SCRIPT_DIR))

from services.spotify.service import *

spotify_service = SpotifyService()

app = Flask(__name__)
CORS(app)

def run_async_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

async def track_monitoring_loop():
    while True:
        try:
            result = spotify_service.get_current_track()
            print(result)
            await asyncio.sleep(1)
        except Exception as e:
            print(f"Error in track monitoring loop: {e}")
            await asyncio.sleep(1)
            
@app.route('/spotify/current-track-loop', methods=['GET'])
def get_current_track():
    global monitor_thread
    
    if monitor_thread is None or not monitor_thread.is_alive():
        # Create a new event loop
        loop = asyncio.new_event_loop()
        
        # Create and start the monitoring thread
        monitor_thread = threading.Thread(target=run_async_loop, args=(loop,), daemon=True)
        monitor_thread.start()
        
        # Schedule the task on the new loop
        asyncio.run_coroutine_threadsafe(track_monitoring_loop(), loop)
        
        return jsonify({"message": "Track monitoring started"})
    else:
        return jsonify({"message": "Track monitoring is already running"})


@app.route('/spotify/current-track', methods=['GET'])
def current_track():
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

@app.route('/spotify/get-next-song', methods=['GET'])
def get_next_song():
    result = spotify_service.get_next_song()
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
    
@app.route('/spotify/seek', methods=['POST'])
def seek():
    try:
        # Get volume from request body
        data = request.get_json()
        
        if not data or 'position_ms' not in data:
            return jsonify({'error': 'Position parameter is required'}), 400
            
        position_ms = data['position_ms']
        
        # Call the service method
        result = spotify_service.seek_song(int(position_ms))
        print(f"result: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=20000)
