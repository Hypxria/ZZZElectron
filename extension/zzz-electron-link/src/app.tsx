class ZZZElectron {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isServerCheckInProgress = false;

  constructor() {
    this.main();
  }

  private async checkServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5001/health', {
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

      this.ws.onmessage = (event) => {
        console.log('Received:', event.data);
        // Handle incoming messages here
        Spicetify.showNotification(`Received: ${event.data}`);
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
    this.connectWebSocket();

    // Show initial message
    Spicetify.showNotification("Hello from ZZZElectron!");

    // Example of sending player duration after 3 seconds
    setTimeout(() => {
      const duration = Spicetify.Player.getDuration();
      this.sendMessage(`Current track duration: ${duration}`);
    }, 3000);
  }

  // Method to safely send messages
  public sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      console.log('Sent message:', message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
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
export default zzzElectron.main.bind(zzzElectron);
