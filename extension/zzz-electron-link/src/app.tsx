var interval = 1000
const workerCode =
  `
self.onmessage = function(e) {
  if (e.data === 'start') {
    setInterval(() => {
      self.postMessage('tick');
    }, ${interval}); // Interval
  }
};
`
  ;

class ZZZElectron {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isServerCheckInProgress = false;

  private progressWorker: Worker | null = null;

  private coverBaseUrl: string = 'https://i.scdn.co/image/';

  constructor() {
    this.main();
  }

  private setupProgressWorker() {
    // Create a Blob containing the worker code
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    // Create and start the worker
    this.progressWorker = new Worker(workerUrl);

    // Listen for worker messages
    this.progressWorker.onmessage = () => {
      const progress = Spicetify.Player.getProgress();
      const duration = Spicetify.Player.getDuration();

      this.sendMessage(JSON.stringify({
        type: 'progress',
        data: {
          progress,
          duration,
          percentage: (progress / duration) * 100
        }
      }));
    };

    // Start the worker
    this.progressWorker.postMessage('start');

    // Clean up the URL
    URL.revokeObjectURL(workerUrl);
  }

  private convertSpotifyImageUriToUrl(uri: string): string {
    // Extract the image ID from the URI
    const imageId = uri.split(':').pop();
    if (!imageId) return '';

    return `https://i.scdn.co/image/${imageId}`;
  }

  private startProgressTracking() {
    if (Spicetify.Player.isPlaying()) {
      if (!this.progressWorker) {
        this.setupProgressWorker();
      }
    } else {
      this.stopProgressTracking();
    }
  }

  private stopProgressTracking() {
    if (this.progressWorker) {
      this.progressWorker.terminate();
      this.progressWorker = null;
    }
  }


  private async checkServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:5001/health', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      return false;
    }
  }


  private async connectWebSocket() {
    // If we're already checking, don't start another check
    if (this.isServerCheckInProgress) {
      return;
    }

    this.isServerCheckInProgress = true;

    try {
      // Check if server is available before attempting connection
      const isAvailable = await this.checkServerAvailable();
      if (!isAvailable) {
        console.log('Server not available, waiting...');
        this.isServerCheckInProgress = false;
        // Try again in 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
        return;
      }

      this.ws = new WebSocket('ws://localhost:5001');

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
        this.reconnectAttempts = 0; // Reset attempts on successful connection
        this.isServerCheckInProgress = false;
        Spicetify.showNotification("WebSocket Connected!");
      };

      this.ws.onmessage = async (event) => {
        console.log('Received in app.tsx:', event.data);
        // Handle incoming messages here
        Spicetify.showNotification(`Received: ${event.data}`);

        const data = JSON.parse(event.data);
        console.log(`data: ${data}`)

        // First check if data is a string (for backwards compatibility)
        if (typeof data === 'string') {
          switch (data) {
            case 'play':
              Spicetify.Player.play();
              break;
            case 'pause':
              Spicetify.Player.pause();
              break;
            case 'next':
              Spicetify.Player.next();
              break;
            case 'prev':
              Spicetify.Player.back();
              break;
            case 'toggle':
              Spicetify.Player.togglePlay();
              break;
            default:
              console.log('Unknown command:', data);
              break;
          }
          return;
        }

        // Handle structured messages with type and action
        switch (data.type) {
          case 'playback':
            switch (data.action) {
              case 'seek':
                console.log(data.value)
                Spicetify.Player.seek(data.value)
              case 'play':
                Spicetify.Player.play();
                break;
              case 'pause':
                Spicetify.Player.pause();
                break;
              case 'next':
                Spicetify.Player.next();
                break;
              case 'prev':
                Spicetify.Player.back();
                break;
              case 'toggle':
                Spicetify.Player.togglePlay();
                break;
              case 'setRepeat':
                // Convert RepeatState string to Spicetify number value
                let repeatValue: number;
                switch (data.value) {
                  case 'off':
                    repeatValue = 0;
                    break;
                  case 'context':
                    repeatValue = 1;
                    break;
                  case 'track':
                    repeatValue = 2;
                    break;
                  default:
                    repeatValue = 0;
                }

                // Set the repeat state
                Spicetify.Player.setRepeat(repeatValue);

                // Send back confirmation
                this.sendMessage(JSON.stringify({
                  type: 'response',
                  action: 'repeatState',
                  data: {
                    state: data.value
                  }
                }));
                break;
              case 'toggleRepeat':
                const currentState = Spicetify.Player.getRepeat();
                let newState;

                // Toggle between states: off -> context -> track -> off
                switch (currentState) {
                  case 0: // off
                    newState = 1; // context (playlist/album repeat)
                    break;
                  case 1: // context
                    newState = 2; // track (single song repeat)
                    break;
                  case 2: // track
                    newState = 0; // off
                    break;
                  default:
                    newState = 0;
                }

                Spicetify.Player.setRepeat(newState);

                // Send back the new state
                this.sendMessage(JSON.stringify({
                  type: 'response',
                  action: 'repeatState',
                  data: {
                    state: newState === 0 ? 'off' :
                      newState === 1 ? 'context' :
                        'track'
                  }
                }));
                break;
              default:
                console.log('Unknown playback action:', data.action);
            }
            break;
          case 'info':
            switch (data.action) {
              case 'next':
                // Handle getting next track info
                const nextTrack = Spicetify.Queue.nextTracks[0]['contextTrack']['metadata'];

                console.log(`Next Tracks: ${JSON.stringify(Spicetify.Queue.nextTracks[0]['contextTrack']['metadata'], null, 2)}`);

                this.sendMessage(JSON.stringify({
                  type: 'response',
                  action: 'next',
                  data: {
                    name: nextTrack.title,
                    artist: nextTrack.artist_name,
                    album: nextTrack.album_title,
                    duration: nextTrack.duration,
                    album_cover: await this.convertSpotifyImageUriToUrl(nextTrack.image_xlarge_url)
                  }
                }));
                break;
              case 'current':
                // Handle getting current track info
                const currentTrack = Spicetify.Player.data.item;
                const accessToken = Spicetify.Platform.Session.accessToken;

                // Get album ID from the current track
                const albumId = currentTrack?.album?.uri?.split(':')[2];

                if (albumId) {
                  // Fetch album details to get release date
                  fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`
                    }
                  })
                    .then(response => response.json())
                    .then(albumData => {
                      // Extract year from release_date
                      const year = albumData.release_date?.split('-')[0];
                      const album_cover = albumData.images?.[0]?.url;

                      console.log('sending')
                      this.sendMessage(JSON.stringify({
                        type: 'response',
                        action: 'current',
                        data: {
                          name: currentTrack?.name || 'No Song Playing',
                          artist: currentTrack?.artists?.[0]?.name || 'Unknown Artist',
                          album: currentTrack?.album?.name || 'Unknown',
                          duration_ms: currentTrack?.duration || 0,
                          album_cover: album_cover,
                          year: year || 'Unknown Year',
                          volume: Spicetify.Player.getVolume(),
                          is_playing: Spicetify.Player.isPlaying(),
                          repeat_state: Spicetify.Player.getRepeat(),
                          shuffle_state: Spicetify.Player.getShuffle(),
                          progress_ms: Spicetify.Player.getProgress(),
                          progress_percentage: Spicetify.Player.getProgressPercent() * 100
                        }
                      }));
                    })
                    .catch(error => {
                      console.error('Error fetching album details:', error);
                      // Send message without year if fetch fails
                      this.sendMessage(JSON.stringify({
                        type: 'response',
                        action: 'current',
                        data: {
                          name: currentTrack?.name || 'No Song Playing',
                          artist: currentTrack?.artists?.[0]?.name || 'Unknown Artist',
                          album: currentTrack?.album?.name || 'Unknown',
                          duration: currentTrack?.duration || 0,
                          album_cover: currentTrack?.metadata?.image_url,
                          year: 'Unknown Year',
                          is_playing: !Spicetify.Player.isPlaying
                        }
                      }));
                    });
                }
                break;
              // ... rest of your switch cases
            }
        }
      };


      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isServerCheckInProgress = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isServerCheckInProgress = false;
        // Don't try to reconnect here - let onclose handle it
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isServerCheckInProgress = false;
      this.handleReconnect();
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.log('Max reconnection attempts reached. Will try again when server becomes available.');
      this.reconnectAttempts = 0; // Reset attempts
      // Check periodically if server becomes available
      setTimeout(() => {
        this.connectWebSocket();
      }, 5000); // Check every 5 seconds
    }
  }

  public async main() {
    // Wait for Spicetify to be ready
    while (!Spicetify?.showNotification) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Initialize WebSocket connection
    await this.connectWebSocket();
    await this.establishListeners()
    // Show initial message
    Spicetify.showNotification("Hello from ZZZElectron!");

    // Example of sending player duration after 3 seconds
    setTimeout(() => {
      const duration = Spicetify.Player.getDuration();
      this.sendMessage(`Current track duration: ${duration}`);
    }, 3000);


  }

  // Method to safely send messages
  public async sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  private async establishListeners() {

    if (Spicetify.Player.isPlaying()) {
      this.startProgressTracking();
    }

    /*
    Deprecated- Short lived due to electron's background tab throttling, slowing the messages

    this.listenForProgressChange(); 
    */
    this.listenForSongChange();
    this.listenForPlayPause();
  }

  private async listenForSongChange() {
    Spicetify.Player.addEventListener('songchange', (event) => {
      this.sendMessage(`Song change: ${event?.data.item.name}`);
    });
  }

  private async listenForPlayPause() {
    Spicetify.Player.addEventListener('onplaypause', (event) => {
      const isPlaying = Spicetify.Player.isPlaying();
      this.sendMessage(`Player is ${isPlaying ? 'playing' : 'paused'}`);
    })
  }

  // Clean up method
  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const zzzElectron = new ZZZElectron();
export default zzzElectron;

