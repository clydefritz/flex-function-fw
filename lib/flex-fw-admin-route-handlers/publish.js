const mqtt = require('mqtt');


// Set up the MQTT client with your broker URL
const mqttIsActive = global.thisFlexFunctionConfigObject.flexFunctionMqttSupport;
const mqttAdminKey = global.thisFlexFunctionConfigObject.flexFunctionStartUp.mqttAdminKey;
const clientId = `mqtt_client_${Math.random().toString(16).substring(2, 8)}`;
const mqttServer = global.thisFlexFunctionConfigObject.flexFunctionMqttServer;
console.log(`MQTT: Active? ${mqttIsActive} Server? ${mqttServer}`);
const mqttClient = mqtt.connect(mqttServer, { clientId: clientId }); // Replace 'mqtt://broker_url' with your broker's URL


// Listen for successful connection
mqttClient.on('connect', () => {
    console.log('From Admin Publish.js - MQTT client connected successfully');
});

// Listen for connection error
mqttClient.on('error', (err) => {
    console.error('From Publish.js - MQTT client connection error:', err);
});



function publish(req, res) {
    if (mqttIsActive === true) {


        //const receivedMessage = JSON.parse(req.body);

        console.log(`${global.thisFlexFunctionName} received publish request`);
        console.log(req.body);

        // Extract topic and message from request body
        var { topic, type, command } = req.body;

        if (!type || type.toLowerCase() === 'admin') {
            req.body.type = 'admin';
        }

        if (!command) {
            console.error('A command was not provided');
            return res.status(400).send('command is required');
        }

        if (!topic) {
            topic = global.thisFlexFunctionName.toLowerCase();
        }


        req.body.flexmqttkey = mqttAdminKey;

        console.log(req.body);

        const messageToPublish = JSON.stringify(req.body);

        console.log(`Topic: ${topic}`);

        // Publish the message
        mqttClient.publish(topic, messageToPublish, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
                if (!req.xPublishNoSend) {
                    res.status(500).send('Failed to publish message');
                } else {
                    throw new Error(`Something went wrong: ${err}`);
                }
            } else {
                console.log('Message published successfully');
                console.log(req.xPublishNoSend);
                if (!req.xPublishNoSend) {
                    res.send('Flex Function publish request received and message published.');
                }
            }
        });
    } else {
        if (!req.xPublishNoSend) {
            res.status(400).send('MQTT is not activated in configuration - Failed to publish message');
        } else {
            return true;
        }
    }
}

module.exports = { publish };