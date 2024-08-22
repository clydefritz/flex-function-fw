const express = require('express');
const http = require('http');
const flexFunction = express();
const fw_env = require('./flex-fw-env-utils');
const requestLogger = require('./flex-fw-func-mw-receipt-logger');
var gcpfunctions_fw = require('@google-cloud/functions-framework');
const MQTTClient = require('./flex-fw-admin-mqtt-files/flex-fw-admin-mqtt-client');
const flexServer = http.createServer(flexFunction);
const { handleMqttMessageReceived } = require('./flex-fw-admin-mqtt-files/flex-fw-admin-mqtt-subscriber');

const startup = require('./flex-fw-env-startuplog');

startup.initializelog();

global.thisFlexFunctionIsStopping = false;

/**
 * Initializes the flex function, sets up the router, and starts the data center listener if required.
 * @returns {Promise<express.Application>} The initialized express application.
 */
async function flexFunctionStart() {
    await fw_env.flexEnvInitializeVars();
    startup.log('Initialized');
    startup.log('Checking MQTT config');
    if (await fw_env.flexEnvGetVariable('flexFunctionMqttSupport') === true) {
        startup.log(`"${global.thisFlexFunctionName}" supports MQTT`);
        const mqttServer = await fw_env.flexEnvGetVariable('flexFunctionMqttServer');
        const mqttBrokerUrl = mqttServer;
        const mqttClient = new MQTTClient(mqttBrokerUrl);
        const mqttAdminTopic  = global.thisFlexFunctionConfigObject.flexFunctionMqttAdminTopic;
        const mqttAllTopic    = global.thisFlexFunctionConfigObject.flexFunctionMqttAllTopic;
        global.flexlog.info(`mqttTopic: ${mqttAdminTopic}`); 

        //await mqttClient.subscribe(mqttTopic, handleMqttAdminMessageReceived());
        await mqttClient.subscribe(mqttAdminTopic, handleMqttMessageReceived, (err) => {
            if (err) {
                global.flexlog.mqtt.error(`Failed to subscribe to topic '${mqttAdminTopic}': ${err.message}`);
            } else {
                global.flexlog.mqtt.log(`Successfully subscribed to topic '${mqttAdminTopic}'`);
            }
        });

        await mqttClient.subscribe(mqttAllTopic, handleMqttMessageReceived, (err) => {
            if (err) {
                global.flexlog.mqtt.error(`Failed to subscribe to topic '${mqttAllTopic}': ${err.message}`);
            } else {
                global.flexlog.mqtt.log(`Successfully subscribed to topic '${mqttAllTopic}'`);
            }
        });

    }

    const flexFuncMwRequestTracker = require('./flex-fw-func-mw-tracker');
    const flexFuncEventRelay = require('./flex-fw-func-mw-eventrelay');
    const flexFuncMwController = require('./flex-fw-func-mw-controller');
    const flexFunctionRouterUser = require('./flex-fw-func-router-user');
    const flexFunctionRouterAdmin = require('./flex-fw-func-router-admin');

    // Use Receipt Logging
    // Set up logging options
    const loggingOptions = {
        console: true,
        file: true,
        filename: 'flexfunc.log',
        gcp: false,
        gcpLogName: 'myapp-log',
    };


    
    //What should the flexFunction express app use?

    //Use the tracker middleware to setup tracking for incoming requests
    flexFunction.use(flexFuncMwRequestTracker);

    //If Int Portal Support is activated, use it
    const intPortalActive = await fw_env.flexEnvGetVariable('flexFunctionIntPortalActive');
    console.log(`Int Portal Active: ${intPortalActive}`);
    if (intPortalActive === true) {
        flexFunction.use(flexFuncEventRelay);
    }

    //Use the controller middleware to control what gets through
    flexFunction.use(flexFuncMwController);

    // Use the logging middleware
    flexFunction.use(requestLogger(loggingOptions));

    // Use the user router for user added flows
    flexFunction.use(flexFunctionRouterUser);

    // Use the admin router for flex provided routes
    flexFunction.use('/flex', flexFunctionRouterAdmin);

    await mqttRequestHelloAtStartUp();

    if (fw_env.flexEnvGetVariable('flexFunctionStartUp.envIsDcFunction')) {
        await startFlexFunctionDcListener();
    }

    global.thisFlexFunctionStatus = { Status: "Active", Time: Date.now() };

    return flexFunction;
}


async function mqttRequestHelloAtStartUp() {
    const { requesthello } = require('./flex-fw-admin-route-handlers/requesthello');
    
    console.log('requesting hello as part of startup');
    const mockres = {};
    mockres.send = () => {console.log(`Requested hello during startup of ${thisFlexFunctionName}`)};
    await requesthello({},mockres);
    
}



/**
 * Starts the express application as a data center app if not in GCP.
 * @returns {Promise<boolean|void>} Resolves to true if not starting the app, otherwise undefined.
 */
async function startFlexFunctionDcListener() {
    const thisFlexFunctionName = global.thisFlexFunctionName;
    var cFlexFunctionDcPort = await fw_env.flexEnvGetVariable('flexFunctionDcPort');
    if (fw_env.flexEnvGetVariable('flexFunctionStartUp.envIsDcFunction')) {
        await new Promise((resolve, reject) => {
            if (!cFlexFunctionDcPort) {
                cFlexFunctionDcPort = 8080;
            }

            //flexFunction.listen(cFlexFunctionDcPort, (err) => {
            flexServer.listen(cFlexFunctionDcPort, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`${thisFlexFunctionName} is listening on port ${cFlexFunctionDcPort}`);
                    resolve();
                }
            });
        });
    } else {
        return true;
    }
}

async function flexFunctionStop() {
    if (global.thisFlexFunctionIsStopping === true) return; // Avoid multiple shutdown signals
    global.thisFlexFunctionIsStopping = true;
    global.thisFlexFunctionIsPaused = true;
    console.log('Received shutdown signal, attempting graceful shutdown.');

    flexServer.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });

    // Forceful shutdown after 15 seconds if necessary
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down.');
        process.exit(1);
    }, await fw_env.flexEnvGetVariable('flexFunctionGracefulWaitMillis') || 10000);
}

// Listen for termination signals
process.on('SIGTERM', flexFunctionStop);
process.on('SIGINT', flexFunctionStop);

module.exports = {
    flexFunctionStart,
    flexFunctionStop
};
