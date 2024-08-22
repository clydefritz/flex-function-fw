// messageHandler.js
const { createToken, readToken } = require('./flex-fw-admin-mqtt-jwt-helper');



global.otherFlexFunctions = global.otherFlexFunctions || [];

// Function to update the otherFlexFunctions array
function updateFlexFunctions(flexObject) {
    // Extract the flexiam value from the object
    const flexiamValue = flexObject.flexiam;

    // Check if the entry with the same flexiam already exists
    const existingIndex = global.otherFlexFunctions.findIndex(entry => entry.flexiam === flexiamValue);

    if (existingIndex !== -1) {
        // If entry exists, replace it
        global.otherFlexFunctions[existingIndex] = flexObject;
    } else {
        // If entry does not exist, add it to the array
        global.otherFlexFunctions.push(flexObject);
    }
}

function handleMqttMessageReceived(message) {

    const messageJsonObject = JSON.parse(message);
    const flexMqttKeyLocal = global.thisFlexFunctionConfigObject.flexFunctionStartUp.mqttAdminKey;

    const pauseCommand = '/flex/pause';
    const resumeCommand = '/flex/resume';
    const sayHelloCommand = '/flex/sayhello';
    const requestHelloCommand = '/flex/requesthello';


    //is the mqtt message from this flex function?
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
        //is the mqtt message a general flex request?
    } else if (messageJsonObject.type.toLowerCase() === 'general') {
        //is it from a flexFunction?
        console.log('In mqtt-subscriber');
        console.log(messageJsonObject);
        if (messageJsonObject.command.toLowerCase() === sayHelloCommand) {
            //console.log(decodedToken);
            console.log('looking in flexmqttkey:');
            const flexjwt = readToken(messageJsonObject.flexmqttkey);
            console.log(flexjwt);
            updateFlexFunctions(flexjwt);
            console.log('Other Flex Funcs Array:');
            console.log(global.otherFlexFunctions);
        } else if (messageJsonObject.command.toLowerCase() === requestHelloCommand) {
            const { sayhello } = require('../flex-fw-admin-route-handlers/sayhello');
            console.log('received a request to send hello');
            const mockres = {};
            mockres.send = () => {console.log(`Sent hello from ${thisFlexFunctionName}`)};
            sayhello({},mockres);

        } else {
            console.log('Didn\'t recognize that');
        }

    } else {

        console.log(`Received a message with invalid key, ignoring.`);
        console.log(message);

    }

}

module.exports = { handleMqttMessageReceived };
