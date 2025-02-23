from rich import print
from spotipy import Spotify
import json
from pathlib import Path
from lrcup import LRCLib
from typing import Optional, Dict, List, Union
import platform
import json


# catching errors
class InvalidSearchError(Exception):
    pass

def exit_application() -> None:
    
    # Exits the application
    
    print("[bold yellow]Exiting application...[/bold yellow]")
    import sys
    sys.exit(0)

class SpotifyController:
    
    # A controller class for interacting with the Spotify API.
    # This class provides methods for various Spotify operations such as
    # playing tracks, managing playlists, and controlling playback.
    
    def __init__(self, spotify: Spotify):
        # 
        # Notes:
        # contructor class, is run the moment that sp_controller = SpotifyController(sp) in main
        #
        # Initialize the SpotifyController.
        #
        # Args:
        #     spotify (Spotify): An authenticated Spotify client object.
        # 
        self.spotify = spotify
        self.lyrics_cache = {}
        self.lrclib = LRCLib()
        self.default_device_id = None

    def getLyrics(self) -> Optional[Dict[str, Union[List[Dict], str, None]]]:
        try:
            # Get current track info
            current_track = self.spotify.current_playback()
            if not current_track or not current_track.get('item'):
                print("No track currently playing")
                return None
                
            track_info = {
                'name': current_track['item']['name'],
                'artist': current_track['item']['artists'][0]['name'],
                'duration': current_track['item']['duration_ms']
            }
            
            # Check cache first
            cache_key = f"{track_info['artist']} - {track_info['name']}"
            if cache_key in self.lyrics_cache:
                print("Found lyrics in cache")
                return self.lyrics_cache[cache_key]

            # Try sources in order of preference
            lyrics = (
                self._get_lrclib_lyrics(track_info) or
                self._get_local_lyrics(track_info)
            )
            
            if lyrics:
                # Cache the result
                self.lyrics_cache[cache_key] = lyrics
                return lyrics
                
            print(f"No lyrics found for: {track_info['name']} by {track_info['artist']}")
            return None
            
        except Exception as e:
            print(f"Error in getLyrics: {e}")
            return None

    def _get_lrclib_lyrics(self, track_info: Dict) -> Optional[Dict]:
        """Try to get synced lyrics from LRCLib"""
        try:
            results = self.lrclib.search(
                track=track_info['name'],
                artist=track_info['artist']
            )
            
            if results and len(results) > 0:
                synced_lyrics = results[0]["syncedLyrics"]
                parsed_lyrics = []
                
                for line in synced_lyrics.split('\n'):
                    if line.strip() and '[' in line:
                        try:
                            time_str = line[line.find('[')+1:line.find(']')]
                            text = line[line.find(']')+1:].strip()
                            
                            # Convert time format [mm:ss.xx] to milliseconds
                            mins, secs = time_str.split(':')
                            time_ms = (int(mins) * 60 + float(secs)) * 1000
                            
                            parsed_lyrics.append({
                                'time': int(time_ms),
                                'words': text
                            })
                        except Exception as e:
                            print(f"Error parsing line '{line}': {e}")
                            continue
                
                if parsed_lyrics:
                    print("Found lyrics in LRCLib")
                    return {
                        'synced': parsed_lyrics,
                        'plain': '\n'.join(line['words'] for line in parsed_lyrics),
                        'provider': 'LRCLib',
                        'track_info': track_info
                    }
                    
        except Exception as e:
            print(f"LRCLib lyrics fetch failed: {e}")
        return None
    
    def _get_local_lyrics(self, track_info: Dict) -> Optional[Dict]:
        """Try to get lyrics from local storage"""
        try:
            lyrics_path = Path(__file__).parent / 'lyrics'
            filename = f"{track_info['artist']} - {track_info['name']}.json"
            lyrics_file = lyrics_path / filename.replace('/', '_')
            
            if lyrics_file.exists():
                with open(lyrics_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {
                        'synced': data.get('synced'),
                        'plain': data.get('plain'),
                        'provider': 'Local',
                        'track_info': track_info
                    }
                    
        except Exception as e:
            print(f"Local lyrics fetch failed: {e}")
        return None
            
    def _get_fallback_lyrics(self, track_info: Dict) -> Optional[Dict]:
        """Try to get unsynced lyrics from fallback sources"""
        try:
            # Example: Could implement other APIs here like Genius, Musixmatch, etc.
            return None
            
        except Exception as e:
            print(f"Fallback lyrics fetch failed: {e}")
        return None
            
    def saveLyrics(self, lyrics_data: Dict) -> bool:
        """
        Save lyrics to local storage
        
        Args:
            lyrics_data: Dictionary containing lyrics data
        
        Returns:
            bool: True if saved successfully
        """
        try:
            if not lyrics_data or 'track_info' not in lyrics_data:
                return False
                
            lyrics_path = Path(__file__).parent / 'lyrics'
            lyrics_path.mkdir(exist_ok=True)
            
            track_info = lyrics_data['track_info']
            filename = f"{track_info['artist']} - {track_info['name']}.json"
            lyrics_file = lyrics_path / filename.replace('/', '_')
            
            with open(lyrics_file, 'w', encoding='utf-8') as f:
                json.dump(lyrics_data, f, ensure_ascii=False, indent=2)
                
            print(f"Lyrics saved to: {lyrics_file}")
            return True
            
        except Exception as e:
            print(f"Error saving lyrics: {e}")
            return False
            
    def getPlaybackProgressPercentage(self) -> float:
        """
        Gets the current playback progress as a percentage.
    
        Returns:
            float: The percentage (0-100) of the way through the current track.
                   Returns 0 if no track is playing.
        """
        current_track = self.spotify.current_user_playing_track()
        
        if current_track is None or not current_track['is_playing']:
            return 0.0
            
        progress_ms = current_track['progress_ms']
        total_ms = current_track['item']['duration_ms']
        
        # Calculate percentage and round to 2 decimal places
        percentage = progress_ms / total_ms
        
        return percentage
    
    def seekSong(self, target_ms) -> None:
        """
        Seeks to the current position in the song based on the playback progress.
        """
        current_track = self.spotify.current_user_playing_track()

        if current_track is None or not current_track['is_playing']:
            print("No track is currently playing.")
            return


        # Seek to the calculated position
        self.spotify.seek_track(target_ms)
    

    def saveLyrics(self, lyrics: str, track_name: str = None, artist_name: str = None) -> bool:
        """
        Save lyrics to local storage for offline access
        
        Args:
            lyrics: str - lyrics text to save
            track_name: str - optional track name (uses current if None)
            artist_name: str - optional artist name (uses current if None)
        
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            if not track_name or not artist_name:
                current_track = self.spotify.current_playback()
                if not current_track or not current_track.get('is_playing'):
                    print("No track is currently playing.")
                    return False
            
                track_name = current_track['item']['name']
                artist_name = current_track['item']['artists'][0]['name']

            lyrics_path = Path(__file__).parent / 'lyrics'
            lyrics_path.mkdir(exist_ok=True)
            
            filename = f"{artist_name} - {track_name}.txt".replace('/', '_')
            lyrics_file = lyrics_path / filename
            
            with open(lyrics_file, 'w', encoding='utf-8') as f:
                f.write(lyrics)
                
            print(f"Lyrics saved to: {lyrics_file}")
            return True
            
        except Exception as e:
            print(f"Error saving lyrics: {e}")
            return False



    def add_current_song_to_playlist(self, playlist_name: str) -> None:
        # 
        # Adds the currently playing song to the specified playlist.

        # Args:
        #     playlist_name (str): The name of the playlist to add the song to.

        # Returns:
        #     None
        # 
        # Get the current song
        current_track = self.spotify.current_user_playing_track()
        if current_track is None:
            print("[bold red]No track is currently playing.[/bold red]")
            return

        track_uri = current_track['item']['uri']
        track_name = current_track['item']['name']

        # Get user's playlists
        playlists = self.spotify.current_user_playlists()
        
        # Find the specified playlist
        target_playlist = next((playlist for playlist in playlists['items'] if playlist['name'].lower() == playlist_name.lower()), None)
        
        if target_playlist is None:
            print(f"[bold red]Playlist '{playlist_name}' not found.[/bold red]")
            return

        # Add the track to the playlist
        self.spotify.user_playlist_add_tracks(self.spotify.me()['id'], target_playlist['id'], [track_uri])
        print(f"[bold green]Added '{track_name}' to playlist '{playlist_name}'.[/bold green]")


    def getCurrentSongInfo(self) -> dict:
        # Get current song information including title, artist, duration, and release year
        
        # Returns:
        #     dict: A dictionary containing song details with the following keys:
        #         - title: str
        #         - artist: str
        #         - duration: str (in MM:SS format)
        #         - release_year: str
        #         - is_playing: bool
        #     Returns None if no song is playing or on error
        try:
            current_track = self.spotify.current_user_playing_track()
            
            if current_track and current_track['item']:
                track_item = current_track['item']
                
                # Calculate duration in minutes and seconds
                duration_ms = track_item['duration_ms']
                minutes = duration_ms // 60000  # Convert to minutes
                seconds = (duration_ms % 60000) // 1000  # Remaining seconds
                
                song_info = {
                    'title': track_item['name'],
                    'artist': ", ".join([artist['name'] for artist in track_item['artists']]),
                    'duration': f"{minutes}:{seconds:02d}",
                    'release_year': track_item['album']['release_date'][:4],
                    'is_playing': current_track['is_playing']
                }
                
                return song_info
                
            return None
            
        except Exception as e:
            print(f"[bold red]Error getting current song information: {e}[/bold red]")
            return None

    def play_previous_song(self) -> None:
            # 
            # Plays the previous song in the queue.

            # Returns:
            #     None
            # 
            self.spotify.previous_track(device_id=self.default_device_id)

    def get_album_uri(self, name: str) -> str:
            # 
            # Searches for and returns the Spotify URI for an album.

            # Args:
            #     name (str): The name of the album to search for.

            # Returns:
            #     str: The Spotify URI of the first matching album.

            # Raises:
            #     InvalidSearchError: If no album is found with the given name.
            # 
            results = self.spotify.search(q=name, type="album")
            if not results["albums"]["items"]:
                raise InvalidSearchError(f"No album found with name: {name}")
            return results["albums"]["items"][0]["uri"]

    def get_track_uri(self, name: str) -> str:
            # 
            # Searches for and returns the Spotify URI for a track.

            # Args:
            #     name (str): The name of the track to search for.

            # Returns:
            #     str: The Spotify URI of the first matching track.

            # Raises:
            #     InvalidSearchError: If no track is found with the given name.
            # 
            results = self.spotify.search(q=name, type="track")
            if not results["tracks"]["items"]:
                raise InvalidSearchError(f"No track found with name: {name}")
            return results["tracks"]["items"][0]["uri"]

    def get_artist_uri(self, name: str) -> str:
            # 
            # Searches for and returns the Spotify URI for an artist.

            # Args:
            #     name (str): The name of the artist to search for.

            # Returns:
            #     str: The Spotify URI of the first matching artist.

            # Raises:
            #     InvalidSearchError: If no artist is found with the given name.
            # 
            results = self.spotify.search(q=name, type="artist")
            if not results["artists"]["items"]:
                raise InvalidSearchError(f"No artist found with name: {name}")
            return results["artists"]["items"][0]["uri"]

    def play_artist(self, uri: str) -> Spotify:
        # 
        # Plays an artist's top tracks from their Spotify URI.

        # Args:
        #     uri (str): The Spotify URI of the artist to play.

        # Returns:
        #     Spotify: The Spotify client object.
        # 
        self.spotify.start_playback(context_uri=uri, device_id=self.default_device_id)
        return self.spotify

    def play_playlist(self, playlist_id: str) -> Spotify:
        # 
        # Plays a playlist from its Spotify ID.

        # Args:
        #     playlist_id (str): The Spotify ID of the playlist to play.

        # Returns:
        #     Spotify: The Spotify client object.
        # 
        self.spotify.start_playback(context_uri=f"spotify:playlist:{playlist_id}", device_id=self.default_device_id)
        return self.spotify

    def next_track(self) -> Spotify:
        # 
        # Skips to the next track in the current playback queue.

        # Returns:
        #     Spotify: The Spotify client object.
        # 
        self.spotify.next_track(device_id=self.default_device_id)
        return self.spotify

    def pause_track(self) -> Spotify:
        # 
        # Pauses the currently playing track.

        # Returns:
        #     Spotify: The Spotify client object.

        # Note:
        #     If the track is already paused, a message will be printed.
        # 
        try:
            self.spotify.pause_playback(device_id=self.default_device_id)
            return self.spotify
        except Exception as e:
            if "Player command failed: Restriction violated" in str(e):
                print("[bold yellow]The track is already paused.[/bold yellow]")
            else:
                print(f"[bold red]An error occurred: {str(e)}[/bold red]")
            return self.spotify

    def resume_track(self) -> Spotify:
        # 
        # Resumes the currently paused track.

        # Returns:
        #     Spotify: The Spotify client object.

        # Note:
        #     If the track is already playing, a message will be printed.
        # 
        try:
            self.spotify.start_playback(device_id=self.default_device_id)
            return self.spotify
        except Exception as e:
            if "Player command failed: Restriction violated" in str(e):
                print("[bold yellow]The track is already playing.[/bold yellow]")
            else:
                print(f"[bold red]An error occurred: {str(e)}[/bold red]")
            return self.spotify

    def is_shuffle_on(self) -> bool:
        # 
        # Checks if shuffle mode is currently enabled.

        # Returns:
        #     bool: True if shuffle is on, False otherwise.

        # Note:
        #     If there's no active playback session, it returns False.
        # 
        playback_state = self.spotify.current_playback()
        if playback_state is not None:
            return playback_state['shuffle_state']
        else:
            print("[bold yellow]No active playback session.[/bold yellow]")
            return False

    def getCoverImage(self) -> str:
        """
        Gets the URL of the cover image for the currently playing track.
    
        Returns:
            str: URL of the album cover image. Returns empty string if no track is playing
                or no image is available.
        """
        current_track = self.spotify.current_user_playing_track()
        
        if current_track is None or not current_track['item']:
            return ""
            
        # Get album images array (contains different sizes)
        images = current_track['item']['album']['images']
        
        if not images:
            return ""
            
        # First image is typically the largest resolution
        # images[0] = large
        # images[1] = medium
        # images[2] = small
        return images[0]['url']    

    def shuffle(self, state: str = None) -> None:
        # 
        # Toggles shuffle mode or sets it to a specific state.

        # Args:
        #     state (str, optional): The desired shuffle state ('on' or 'off').
        #         If not provided, the current state will be toggled.

        # Returns:
        #     None

        # Note:
        #     Prints a message indicating the new shuffle state.
        # 
        current_state = self.is_shuffle_on()
        
        if state is None:
            # Toggle shuffle
            new_state = not current_state
        else:
            # Set shuffle to specified state
            new_state = state.lower() == 'on'
        
        if new_state != current_state:
            self.spotify.shuffle(new_state, device_id=self.default_device_id)
            print(f"[bold green]Shuffle {'enabled' if new_state else 'disabled'}.[/bold green]")
        else:
            print(f"[bold yellow]Shuffle is already {'on' if new_state else 'off'}.[/bold yellow]")

    def change_volume(self, volume: int) -> Spotify:
        # 
        # Changes the volume of the playback.

        # Args:
        #     volume (int): The desired volume level (0-100).

        # Returns:
        #     Spotify: The Spotify client object.

        # Note:
        #     Prints a message confirming the new volume level.
        # 
        self.spotify.volume(volume, device_id=self.default_device_id)
        print(f"[bold green]Volume set to {volume}%[/bold green]")
        return self.spotify

    def repeat_track(self) -> Spotify:
        # 
        # Toggles repeat mode for the current track.

        # Returns:
        #     Spotify: The Spotify client object.

        # Note:
        #     Prints a message indicating the new repeat mode state.
        #     If there's no active playback session, a message will be printed.
        # 
        playback = self.spotify.current_playback()
        if playback:
            current_state = playback['repeat_state']
            new_state = 'track' if current_state != 'track' else 'off'
            self.spotify.repeat(new_state, device_id=self.default_device_id)
            print(f"[bold green]Repeat mode set to: {new_state}[/bold green]")
        else:
            print("[bold yellow]No active playback session.[/bold yellow]")
        return self.spotify

    def shuffle(self, state: str) -> Spotify:
        # 
        # Sets the shuffle state for the player.

        # Args:
        #     state (str): The desired shuffle state ('on' or 'off').

        # Returns:
        #     Spotify: The Spotify client object.

        # Note:
        #     Prints a message confirming the new shuffle state.
        # 
        state_bool = state.lower() == 'on'
        self.spotify.shuffle(state_bool, device_id=self.default_device_id)
        print(f"[bold green]Shuffle {'enabled' if state_bool else 'disabled'}.[/bold green]")
        return self.spotify

    def get_user_saved_tracks(self) -> list:
        # 
        # Retrieves a list of tracks saved in the user's library.

        # Returns:
        #     list: A list of strings, each containing a track name and its artist.

        # Note:
        #     This method handles pagination to retrieve all saved tracks.
        # 
        tracks = []
        results = self.spotify.current_user_saved_tracks(limit=50)
        
        while results:
            for item in results['items']:
                track = item['track']
                tracks.append(f"{track['name']} by {track['artists'][0]['name']}")
            if results['next']:
                results = self.spotify.next(results)
            else:
                results = None
        
        return tracks

    def uncomingSong(self) -> dict:
        #
        # Retrieves information about the next song in the queue.

        # Returns:
        #     dict: A dictionary containing details of the next song, including its name,
        #         artist, album, and duration. If there's no upcoming song, returns an empty dictionary.

        # Note:
        #     This method assumes that the first item in the queue is the upcoming song.
        #
        queue = self.spotify.queue()
        if not queue['queue']:
            return {}
        
        print(queue['queue'][0])

        next_song = queue['queue'][0]
        return {
            'album_cover': next_song['album']['images'][0]['url'],
            'name': next_song['name'],
            'artist': next_song['artists'][0]['name'],
        }
    
    def init_default_device(self) -> str:
        # Initializes the default device for playback.

        # Args:
        #     local_device: The local device information.

        # Returns:
        #     str: The name of the initialized default device.

        # Note:
        #     This method searches for available devices and sets the default device
        #     based on the provided local device information.
        results = self.spotify.devices()
        local_device= platform.node().lower()
        
        device_name = None
        for device in results["devices"]:
            if device["name"].lower() == local_device:
                self.default_device_id = device["id"]
                device_name = device["name"]
                print("Default device detected: " + device_name)
                break
            else:
                print("Default device not found, pick one from these")
                for i, device in enumerate(results["devices"], 1):
                    print(f"{i}. {device['name']}")
                    # Completing later- lunch ended
                print(len(results['devices']))
                choice = int(input("Enter the number of the device: "))
                selectedDevice = results['devices'][choice - 1]
                self.default_device_id = selectedDevice["id"]
                device_name = selectedDevice["name"]
                print(self.default_device_id)       
                print(device_name)
                break 
        return device_name

