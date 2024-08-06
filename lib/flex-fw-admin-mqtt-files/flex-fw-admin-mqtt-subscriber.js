// messageHandler.js
function handleMqttMessageReceived(message) {

    const messageJsonObject = JSON.parse(message);
    const flexMqttKeyLocal = global.thisFlexFunctionConfigObject.flexFunctionStartUp.mqttAdminKey;
    const pauseCommand = '/flex/pause';
    const resumeCommand = '/flex/resume';


    if (messageJsonObject.flexmqttkey === flexMqttKeyLocal) {

        if (messageJsonObject.type.toLowerCase() === 'admin') {

            if (messageJsonObject.command.toLowerCase() === pauseCommand) {

                global.thisFlexFunctionIsPaused = true;
                console.log(`${global.thisFlexFunctionName} is pausing ...`);

            } else if (messageJsonObject.command.toLowerCase() === resumeCommand) {

                global.thisFlexFunctionIsPaused = false;
                console.log(`${global.thisFlexFunctionName} is resuming ...`);

            }
        } else {

            console.log(`Received mqtt message - only admin messages are currently supported, ignoring.`);
            console.log(message);

        }

    } else {

        console.log(`Received a message with invalid key, ignoring.`);
        console.log(message);

    }

}

module.exports = { handleMqttMessageReceived };
