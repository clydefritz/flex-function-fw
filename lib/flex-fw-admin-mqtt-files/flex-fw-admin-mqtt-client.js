const mqtt = require('mqtt');

class MQTTClient {
  constructor(brokerUrl, options = {}) {
    this.brokerUrl = brokerUrl;
    this.options = options;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 20000; // 20 seconds in milliseconds
    this.client = null;
    this.subscriptions = new Map(); // Initialize subscriptions as a Map

    this.connect();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl, this.options);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        this.retryCount = 0; // Reset retry counter on successful connection
        this.resubscribeAll();
        resolve(); // Resolve the promise on successful connection
      });

      this.client.on('error', (error) => {
        console.error('MQTT Client Error:', error);
        reject(error); // Reject the promise on connection error
      });

      this.client.on('close', () => {
        if (this.retryCount < this.maxRetries) {
          setTimeout(() => {
            if (this.retryCount < this.maxRetries) { // Check again before reconnecting
              this.retryCount++;
              this.connect(); // Attempt to reconnect
            } else {
              reject(new Error('Max retry attempts reached. No further reconnect attempts will be made.'));
              this.client.end(true); // Forcefully close the client connection
            }
          }, this.retryDelay);
        }
      });

      this.client.on('message', (topic, message) => {
        const callback = this.subscriptions.get(topic);
        if (callback) {
          callback(message.toString()); // Convert buffer to string and call the callback
        } else {
          console.warn(`No callback found for topic: ${topic}`);
        }
      });
    });
  }

  subscribe(topic, callback) {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (err, granted) => {
        if (err) {
          console.error(`Failed to subscribe to topic: ${topic}`, err);
          reject(err);
        } else if (granted && granted[0] && granted[0].qos !== 128) {
          this.subscriptions.set(topic, callback);
          console.log(`Subscribed to topic: ${topic} with QoS: ${granted[0].qos}`);
          resolve(granted);
        } else {
          const error = new Error(`Subscription to topic: ${topic} was rejected by the broker`);
          console.error(error);
          reject(error);
        }
      });
    });
  }

  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      this.client.unsubscribe(topic, (err) => {
        if (!err) {
          this.subscriptions.delete(topic);
          console.log(`Unsubscribed from topic: ${topic}`);
          resolve();
        } else {
          console.error(`Failed to unsubscribe from topic: ${topic}`, err);
          reject(err);
        }
      });
    });
  }

  resubscribeAll() {
    this.subscriptions.forEach((callback, topic) => {
      this.subscribe(topic, callback);
    });
  }

  end() {
    this.client.end();
    console.log('MQTT client connection closed');
  }
}

module.exports = MQTTClient;
