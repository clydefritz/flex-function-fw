
const { publish } = require('./publish');
const os = require('os');


async function requesthello(req, res) {

    console.log(`${global.thisFlexFunctionName} received a request to request hello from other flexes`);

    console.log(`Is MQTT active?  ${global.thisFlexFunctionConfigObject.flexFunctionMqttSupport}`);

    if (global.thisFlexFunctionConfigObject.flexFunctionMqttSupport === true) {
        const currentTime = new Date();
        const processUptime = process.uptime();
        const processStartTime = new Date(currentTime.getTime() - processUptime * 1000);
        const newReqBody = {
            topic: global.thisFlexFunctionConfigObject.flexFunctionMqttAllTopic,
            type: "general",
            command: "/flex/requesthello",
            flexiam: global.thisFlexFunctionConfigObject.flexFunctionName,
            flexsendtime: new Date(currentTime.getTime()).toISOString(),
            jwt: true
        };

        console.log(newReqBody);

        req.body = newReqBody;
        req.xPublishNoSend = 'true';
        console.log(req.xPublishNoSend);
        try {
            console.log('About to call publish for requesthello');
            await publish(req, res);
        } catch {
            console.log('Cloud not publish from requesthello.js');
        }
    }
    res.send("Flex Function requesthello requested.");

};

module.exports = { requesthello };