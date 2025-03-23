import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 28323 });

async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  // Show message on start.
  Spicetify.showNotification("Hello from ZZZElectron!");
  // Show message on start.
  setTimeout(() => {
    let message = String(Spicetify.Player.getDuration());
    Spicetify.showNotification(message);
  }, 3000);
}

export default main;
