from typing import Dict, Any
from .methods.methods import SpotifyController
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SpotifyService:
    def __init__(self):
        # Initialize Spotify client
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=os.getenv('SPOTIFY_CLIENT_ID'),
            client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
            redirect_uri=os.getenv('SPOTIFY_REDIRECT_URI'),
            scope="user-read-playback-state user-modify-playback-state user-read-currently-playing user-library-read"
        ))
        
        # Initialize controller
        self.sp_controller = SpotifyController(self.sp)
        self.device_name = self.sp_controller.init_default_device()
    
    def seek_song(self, position_ms: int) -> Dict[str, str]:
        try:
            self.sp_controller.seekSong(position_ms)
            return {'status': 'success'}
        except Exception as e:
            raise Exception(str(e))
    
    async def start_monitoring(self) -> Dict[str, str]:
        try:
            await self.sp_controller.start_playback_monitoring()
            return {'status': 'success'}
        except Exception as e:
            raise Exception(str(e))
            
    async def stop_monitoring(self) -> Dict[str, str]:
        try:
            await self.sp_controller.stop_playback_monitoring()
            return {'status': 'success'}
        except Exception as e:
            raise Exception(str(e))
    
    def get_next_song(self) -> Dict[str, Any]:
        try:
            next_song = self.sp_controller.uncomingSong()
            if next_song:
                return next_song
            raise Exception('No next song available')
        except Exception as e:
            raise Exception(str(e))
    
    def get_playback_state(self) -> Dict[str, Any]:
        try:
            state = self.sp_controller.get_current_playback_state()
            if state:
                return state
            raise Exception('No playback state available')
        except Exception as e:
            raise Exception(str(e))
            
    def get_current_track(self) -> Dict[str, Any]:
        try:
            current_track = self.sp.current_playback()
            if not current_track or not current_track.get('item'):
                raise Exception('No track currently playing')
                
            return {
                'name': current_track['item']['name'],
                'artist': current_track['item']['artists'][0]['name'],
                'album_cover': current_track['item']['album']['images'][0]['url'] if current_track['item']['album']['images'] else None,
                'year': current_track['item']['album']['release_date'][:4],
                'is_playing': current_track['is_playing'],
                'duration_ms': current_track['item']['duration_ms'],
                'shuffle_state': current_track['shuffle_state'],
                'repeat_state': current_track['repeat_state'],
                'volume_percent': current_track['device']['volume_percent'],
                'progress_ms': current_track['progress_ms'],
            }
        except Exception as e:
            raise Exception(str(e))
            
    def next_track(self) -> Dict[str, bool]:
        try:
            self.sp_controller.next_track()
            return {'success': True}
        except Exception as e:
            raise Exception(str(e))
            
    def previous_track(self) -> Dict[str, bool]:
        try:
            self.sp.previous_track()
            return {'success': True}
        except Exception as e:
            raise Exception(str(e))
            
    def pause_playback(self) -> Dict[str, bool]:
        try:
            self.sp.pause_playback()
            return {'success': True}
        except Exception as e:
            raise Exception(str(e))
            
    def start_playback(self) -> Dict[str, bool]:
        try:
            self.sp.start_playback()
            return {'success': True}
        except Exception as e:
            raise Exception(str(e))
            
    def get_lyrics(self) -> Dict[str, Any]:
        try:
            lyrics = self.sp_controller.getLyrics()
            if lyrics:
                return lyrics
            raise Exception('No lyrics found')
        except Exception as e:
            raise Exception(str(e))
            
    def get_spotify_token(self) -> Dict[str, str]:
        try:
            token_info = self.sp.auth_manager.get_cached_token()
            
            if token_info and not self.sp.auth_manager.is_token_expired(token_info):
                return {'token': token_info['access_token']}
            else:
                if token_info:
                    token_info = self.sp.auth_manager.refresh_access_token(token_info['refresh_token'])
                return {'token': token_info['access_token']}
        except Exception as e:
            raise Exception(str(e))
    
    def set_volume(self, volume: int):
        try:
            self.sp_controller.change_volume(volume)
            return {'success': True}
        except Exception as e:
            raise Exception(str(e))