from flask import Flask, jsonify
from ..services.spotify.service import SpotifyService

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

if __name__ == '__main__':
    app.run(debug=True)