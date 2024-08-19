
const { publish } = require('./publish');
const os = require('os');


function sayhello(req, res) {

    console.log(`${global.thisFlexFunctionName} received a request to say hello to others`);

    console.log(`Is MQTT active?  ${global.thisFlexFunctionConfigObject.flexFunctionMqttSupport}`);

    if (global.thisFlexFunctionConfigObject.flexFunctionMqttSupport === true) {
        const currentTime = new Date();
        const processUptime = process.uptime();
        const processStartTime = new Date(currentTime.getTime() - processUptime * 1000);
        const newReqBody = {
            topic: global.thisFlexFunctionConfigObject.flexFunctionMqttAllTopic,
            type: "general",
            command: "/flex/sayhello",
            flexiam: global.thisFlexFunctionConfigObject.flexFunctionName,
            flexlocation: global.thisFlexFunctionLocation,
            flexdcport: global.flexFunctionDcPort,
            flexhost: os.hostname(),
            flexhosttype: os.type(),
            flexplatform: os.platform(),
            flexstarttimeiso: processStartTime.toISOString(),
            flexsendtime: new Date(currentTime.getTime()).toISOString(),
            jwt: true
        };

        console.log(newReqBody);

        req.body = newReqBody;
        req.xPublishNoSend = 'true';
        console.log(req.xPublishNoSend);
        try {
            console.log('About to call publish for flexhello');
            publish(req, res);
        } catch {
            console.log('Cloud not publish from flexhello.js');
        }
    }
    res.send("Flex Function hello requested.");

};

module.exports = { sayhello };