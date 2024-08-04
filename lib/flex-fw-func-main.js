const express = require('express');
const http = require('http');
const flexFunction = express();
const fw_env = require('./flex-fw-env-utils');
const requestLogger = require('./flex-fw-func-mw-receipt-logger');
var gcpfunctions_fw = require('@google-cloud/functions-framework');
const flexServer = http.createServer(flexFunction);

process.env.thisFlexFunctionIsStopping = false;
console.log(`process.env.thisFlexFunctionIsStopping: ${process.env.thisFlexFunctionIsStopping}`);

/**
 * Initializes the flex function, sets up the router, and starts the data center listener if required.
 * @returns {Promise<express.Application>} The initialized express application.
 */
async function flexFunctionStart() {
    console.log('Entered flex function start');
    await fw_env.flexEnvInitializeVars();
    console.log('Line after await flexEnvInitializeVars');
    const flexFuncMwController    = require('./flex-fw-func-mw-controller');
    const flexFunctionRouterUser  = require('./flex-fw-func-router-user');
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
    flexFunction.use(flexFuncMwController);

    // Use the logging middleware
    flexFunction.use(requestLogger(loggingOptions));

    // Use the user router for user added flows
    flexFunction.use(flexFunctionRouterUser);

    // Use the admin router for flex provided routes
    flexFunction.use('/flex', flexFunctionRouterAdmin);

    if (fw_env.flexEnvGetVariable(process.env.thisFunctionName, 'envIsDcFunction')) {
        await startFlexFunctionDcListener();
    } else if (fw_env.flexEnvGetVariable(process.env.thisFunctionName, 'envIsGcpFunction')) {
        gcpfunctions_fw.http(process.env.thisFunctionName || 'default-function', flexFunctionlexFunction);
    }
    return flexFunction;
}

/**
 * Starts the express application as a data center app if not in GCP.
 * @returns {Promise<boolean|void>} Resolves to true if not starting the app, otherwise undefined.
 */
async function startFlexFunctionDcListener() {
    const thisFlexFunctionName = process.env.thisFunctionName;
    var cFlexFunctionDcPort = await fw_env.flexEnvGetVariable(thisFlexFunctionName, 'flexFunctionDcPort');
    if (fw_env.flexEnvGetVariable(thisFlexFunctionName, 'flexFunctionStartUp.envIsDcFunction')) {
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

function flexFunctionStop() {
    if (process.env.thisFlexFunctionIsStopping === 'true') return; // Avoid multiple shutdown signals
    process.env.thisFlexFunctionIsStopping = 'true';
    console.log('Received shutdown signal, attempting graceful shutdown.');
  
    flexServer.close(() => {
      console.log('Closed out remaining connections.');
      process.exit(0);
    });
  
    // Forceful shutdown after 15 seconds if necessary
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 15000);
  }

// Listen for termination signals
process.on('SIGTERM', flexFunctionStop);
process.on('SIGINT', flexFunctionStop);

module.exports = {
    flexFunctionStart,
    flexFunctionStop
};
