
const { publish } = require('./publish');

function resume(req, res) {

    console.log(`${global.thisFlexFunctionName} received resume request`);

    global.thisFlexFunctionIsPaused = false;

    console.log(`MQTT: ${global.thisFlexFunctionConfigObject.flexFunctionMqttSupport}`);

    const newReqBody = {    
            type: "admin",
            command: "/flex/resume"
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
    
        
    res.send("Flex Function resume requested.  Resuming active processing of requests.");

};

module.exports = { resume };