
const { publish } = require('./publish');

function pause(req, res) {

    console.log(`${global.thisFlexFunctionName} received pause request`);

    global.thisFlexFunctionIsPaused = true;

    console.log(`MQTT: ${global.thisFlexFunctionConfigObject.flexFunctionMqttSupport}`);

    if (global.thisFlexFunctionConfigObject.flexFunctionMqttSupport === true) {
        const newReqBody = {
            type: "admin",
            command: "/flex/pause"
        };

        console.log(`New req body:`, newReqBody);

        req.body = newReqBody;
        req.xPublishNoSend = 'true';
        console.log(req.xPublishNoSend);
        try {
            console.log('About to call publ')
            publish(req, res);
        } catch {
            console.log('Cloud not publish from resume.js');
        }
    }
    res.send("Flex Function pause requested.  Draining started.");

};

module.exports = { pause };