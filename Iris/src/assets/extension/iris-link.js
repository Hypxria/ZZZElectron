(async function() {
        while (!Spicetify.React || !Spicetify.ReactDOM) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        var irisDlink = (() => {
  // src/app.tsx
  var interval = 100;
  var workerCode = `
self.onmessage = function(e) {
  if (e.data === 'start') {
    setInterval(() => {
      self.postMessage('tick');
    }, ${interval}); // Interval
  }
};
`;
  var Iris = class {
    constructor() {
      this.ws = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 10;
      this.isServerCheckInProgress = false;
      this.progressWorker = null;
      this.wasAutoSwitchedThisSong = false;
      this.progress = 0;
      this.main();
    }
    setupProgressWorker() {
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      this.progressWorker = new Worker(workerUrl);
      this.progressWorker.onmessage = () => {
        console.log("message");
        let subtract;
        if (this.wasAutoSwitchedThisSong) {
          subtract = 750;
        } else {
          subtract = 0;
        }
        const progress = Math.max(Spicetify.Player.getProgress() - subtract, 0);
        const duration = Spicetify.Player.getDuration();
        this.progress = progress;
        console.log(JSON.stringify({
          type: "progress",
          data: {
            progress,
            duration,
            percentage: progress / duration * 100
          }
        }));
        this.sendMessage(JSON.stringify({
          type: "progress",
          data: {
            progress,
            duration,
            percentage: progress / duration * 100
          }
        }));
      };
      this.progressWorker.postMessage("start");
      URL.revokeObjectURL(workerUrl);
    }
    convertSpotifyImageUriToUrl(uri) {
      const imageId = uri.split(":").pop();
      if (!imageId)
        return "";
      return `https://i.scdn.co/image/${imageId}`;
    }
    startProgressTracking() {
      if (!this.progressWorker) {
        this.setupProgressWorker();
      }
    }
    stopProgressTracking() {
      if (this.progressWorker) {
        this.progressWorker.terminate();
        this.progressWorker = null;
      }
    }
    async checkServerAvailable() {
      try {
        const response = await fetch("http://127.0.0.1:5001/health", {
          method: "HEAD",
          mode: "no-cors"
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    async connectWebSocket() {
      if (this.isServerCheckInProgress) {
        return;
      }
      this.isServerCheckInProgress = true;
      try {
        const isAvailable = await this.checkServerAvailable();
        if (!isAvailable) {
          console.log("Server not available, waiting...");
          this.isServerCheckInProgress = false;
          setTimeout(() => this.connectWebSocket(), 5e3);
          return;
        }
        this.ws = new WebSocket("ws://localhost:5001");
        this.ws.onopen = () => {
          console.log("Connected to WebSocket server");
          this.reconnectAttempts = 0;
          this.isServerCheckInProgress = false;
          Spicetify.showNotification("WebSocket Connected!");
        };
        this.ws.onmessage = async (event) => {
          var _a, _b, _c, _d;
          console.log("Received in app.tsx:", event.data);
          const data = JSON.parse(event.data);
          console.log(`data: ${data}`);
          switch (data.type) {
            case "playback":
              switch (data.action) {
                case "volume":
                  Spicetify.Player.setVolume(data.value / 100);
                  break;
                case "seek":
                  console.log(data.value);
                  Spicetify.Player.seek(data.value);
                  break;
                case "play":
                  Spicetify.Player.play();
                  break;
                case "pause":
                  Spicetify.Player.pause();
                  break;
                case "next":
                  Spicetify.Player.next();
                  break;
                case "prev":
                  Spicetify.Player.back();
                  break;
                case "toggle":
                  Spicetify.Player.togglePlay();
                  break;
                case "shuffle":
                  Spicetify.Player.toggleShuffle();
                  break;
                case "setRepeat":
                  let repeatValue;
                  switch (data.value) {
                    case "off":
                      repeatValue = 0;
                      break;
                    case "context":
                      repeatValue = 1;
                      break;
                    case "track":
                      repeatValue = 2;
                      break;
                    default:
                      repeatValue = 0;
                  }
                  Spicetify.Player.setRepeat(repeatValue);
                  this.sendMessage(JSON.stringify({
                    type: "response",
                    action: "repeatState",
                    data: {
                      state: data.value
                    }
                  }));
                  break;
                case "toggleRepeat":
                  const currentState = Spicetify.Player.getRepeat();
                  let newState;
                  switch (currentState) {
                    case 0:
                      newState = 1;
                      break;
                    case 1:
                      newState = 2;
                      break;
                    case 2:
                      newState = 0;
                      break;
                    default:
                      newState = 0;
                  }
                  Spicetify.Player.setRepeat(newState);
                  this.sendMessage(JSON.stringify({
                    type: "response",
                    action: "repeatState",
                    data: {
                      state: newState === 0 ? "off" : newState === 1 ? "context" : "track"
                    }
                  }));
                  break;
                default:
                  console.log("Unknown playback action:", data.action);
              }
              break;
            case "info":
              switch (data.action) {
                case "next":
                  const nextTrack = Spicetify.Queue.nextTracks[0]["contextTrack"]["metadata"];
                  const nextAlbumId = (_a = nextTrack.album_uri) == null ? void 0 : _a.split(":")[2];
                  const nextAccessToken = Spicetify.Platform.Session.accessToken;
                  let nextYear;
                  console.log(`Next Tracks: ${JSON.stringify(Spicetify.Queue.nextTracks[0]["contextTrack"]["metadata"], null, 2)}`);
                  fetch(`https://api.spotify.com/v1/albums/${nextAlbumId}`, {
                    headers: {
                      "Authorization": `Bearer ${nextAccessToken}`
                    }
                  }).then((response) => response.json()).then((albumData) => {
                    var _a2;
                    nextYear = (_a2 = albumData.release_date) == null ? void 0 : _a2.split("-")[0];
                  });
                  this.sendMessage(JSON.stringify({
                    type: "response",
                    action: "next",
                    data: {
                      name: nextTrack.title,
                      artist: nextTrack.artist_name,
                      album: nextTrack.album_title,
                      duration: nextTrack.duration,
                      album_cover: this.convertSpotifyImageUriToUrl(nextTrack.image_xlarge_url),
                      year: nextYear || 2e3
                    }
                  }));
                  break;
                case "current":
                  const currentTrack = Spicetify.Player.data.item;
                  console.log(`current track: ${currentTrack}`);
                  this.sendMessage(JSON.stringify({
                    type: "response",
                    action: "current",
                    data: {
                      name: (currentTrack == null ? void 0 : currentTrack.name) || "No Song Playing",
                      artist: ((_c = (_b = currentTrack == null ? void 0 : currentTrack.artists) == null ? void 0 : _b[0]) == null ? void 0 : _c.name) || "Unknown Artist",
                      album: ((_d = currentTrack == null ? void 0 : currentTrack.album) == null ? void 0 : _d.name) || "Unknown",
                      duration_ms: (currentTrack == null ? void 0 : currentTrack.duration) || 0,
                      album_cover: this.convertSpotifyImageUriToUrl(currentTrack.metadata.image_xlarge_url),
                      year: this.songyear || "Unknown Year",
                      volume: Spicetify.Player.getVolume(),
                      is_playing: Spicetify.Player.isPlaying(),
                      repeat_state: Spicetify.Player.getRepeat(),
                      shuffle_state: Spicetify.Player.getShuffle(),
                      progress_ms: Spicetify.Player.getProgress(),
                      progress_percentage: Spicetify.Player.getProgressPercent() * 100
                    }
                  }));
                  break;
              }
          }
        };
        this.ws.onclose = () => {
          console.log("WebSocket connection closed");
          this.isServerCheckInProgress = false;
          this.handleReconnect();
        };
        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isServerCheckInProgress = false;
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        this.isServerCheckInProgress = false;
        this.handleReconnect();
      }
    }
    async handleReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
          this.connectWebSocket();
        }, delay);
      } else {
        console.log("Max reconnection attempts reached. Will try again when server becomes available.");
        this.reconnectAttempts = 0;
        setTimeout(() => {
          this.connectWebSocket();
        }, 5e3);
      }
    }
    async main() {
      while (!(Spicetify == null ? void 0 : Spicetify.showNotification)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await this.connectWebSocket();
      await this.establishListeners();
      Spicetify.showNotification("Hello from ZZZElectron!");
    }
    async sendMessage(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(message);
      } else {
        console.warn("WebSocket is not connected. Message not sent:", message);
      }
    }
    async establishListeners() {
      this.startProgressTracking();
      this.listenForSongChange();
      this.listenForPlayPause();
    }
    async listenForSongChange() {
      let previousDuration = Spicetify.Player.getDuration();
      ;
      Spicetify.Player.addEventListener("songchange", (event) => {
        var _a;
        console.log(`song: ${Spicetify.Player.getProgress()}`);
        if (this.progress > previousDuration - 3550 && Spicetify.Player.getRepeat() !== 2) {
          console.log("Song ended naturally");
          this.wasAutoSwitchedThisSong = true;
          setTimeout(() => {
          }, 2e3);
        } else {
          this.wasAutoSwitchedThisSong = false;
          console.log("Song ended abruptly");
        }
        const currentTrack = Spicetify.Player.data.item;
        const accessToken = Spicetify.Platform.Session.accessToken;
        const trackId = (_a = currentTrack == null ? void 0 : currentTrack.uri) == null ? void 0 : _a.split(":")[2];
        console.log(JSON.stringify(currentTrack, null, 2));
        fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        }).then((response) => response.json()).then((albumData) => {
          var _a2, _b;
          this.songyear = (_b = (_a2 = albumData.album) == null ? void 0 : _a2.release_date) == null ? void 0 : _b.split("-")[0];
        });
        console.log(`Song ended: Previous Duration: ${previousDuration}`);
        console.log(`Song ended: Previous Progress: ${this.progress}`);
        previousDuration = Spicetify.Player.getDuration();
      });
    }
    async listenForPlayPause() {
      Spicetify.Player.addEventListener("onplaypause", (event) => {
        const isPlaying = Spicetify.Player.isPlaying();
      });
    }
    cleanup() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  };
  var zzzElectron = new Iris();
  var app_default = zzzElectron;

  // C:/Users/vivip/AppData/Local/Temp/spicetify-creator/index.jsx
  (async () => {
    await app_default();
  })();
})();

      })();