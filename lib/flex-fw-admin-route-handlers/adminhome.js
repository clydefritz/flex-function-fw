const fs = require('fs');
const path = require('path');


exports.adminhome = function adminhome(req, res) {
    const filePath = path.join(__dirname, '../flex-fw-admin-files', 'flex-function-admin.html');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the HTML file:', err);
            res.status(500).send('Server Error: Unable to load the admin page.');
            return;
        }

        var thisFlexFunctionStatus;
        if (global.thisFlexFunctionIsStopping === true) {
            thisFlexFunctionStatus = 'Stopping';
        } else if (global.thisFlexFunctionIsPaused === true) {
            thisFlexFunctionStatus = 'Paused';
        } else {
            thisFlexFunctionStatus = 'Active';
        }

        var thisFlexFunctionRecentActivity = convertInProgressToJson();

        // Dynamic variable substitution
        const thisFlexFunctionName       = global.thisFlexFunctionName || 'Default Flex Function';
        const thisFlexFunctionLocation   = global.thisFlexFunctionLocation;
        const thisFlexFunctionStarted    = global.thisFlexFunctionStartTime;
        const thisFlexFunctionStatusTime = new Date(global.thisFlexFunctionStatus.Time);
        const thisFlexFunctionMqttActive = global.thisFlexFunctionConfigObject.flexFunctionMqttSupport;
        const thisFlexFunctionMqttServer = global.thisFlexFunctionConfigObject.flexFunctionMqttServer;
        const thisFlexFunctionMqttTopic  = global.thisFlexFunctionConfigObject.flexFunctionMqttAdminTopic;
        const otherActiveFlexes          = convertOtherFlexesToJson();

        const adminUserName = 'Flex Admin'; // Example value, replace with dynamic data as needed

        // Replace placeholders in the HTML content
        console.log('From adminhime.js');
        console.log(otherActiveFlexes);

        let content = data
            .replace(/\${thisFlexFunctionName}/g, thisFlexFunctionName)
            .replace(/\${adminUserName}/g, adminUserName)
            .replace(/\${thisFlexFunctionStatus}/g, thisFlexFunctionStatus)
            .replace(/\${thisFlexFunctionLocation}/g, thisFlexFunctionLocation)
            .replace(/\${startupTime}/g, thisFlexFunctionStarted)
            .replace(/\${thisFlexFunctionStatusTime}/g, thisFlexFunctionStatusTime)
            .replace(/\${mqttActive}/g, thisFlexFunctionMqttActive)
            .replace(/\${mqttServer}/g, thisFlexFunctionMqttServer)
            .replace(/\${mqttTopic}/g, thisFlexFunctionMqttTopic)
            .replace(/\$thisFlexFunctionRecentActivity/g, thisFlexFunctionRecentActivity)
            .replace(/\$currentFlexes/g, otherActiveFlexes);

        res.send(content);
    });
};

function convertInProgressToJson() {
    if (!global.inProcessRequests || global.inProcessRequests.size === 0) {
        const noRequests = { 'noRequests': true};
        return JSON.stringify(noRequests);
    }
    const requests = Array.from(global.inProcessRequests.values());
    return JSON.stringify(requests);
}

function convertOtherFlexesToJson() {
    if (!global.otherFlexFunctions || global.otherFlexFunctions.size === 0) {
        const noFlexes = { 'noFlexes': true};
        return JSON.stringify(noFlexes);
    }
    const flexes = Array.from(global.otherFlexFunctions.values());
    return JSON.stringify(flexes);
}

