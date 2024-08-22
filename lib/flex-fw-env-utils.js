const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const startup = require('./flex-fw-env-startuplog');

// Load configuration from JSON file
async function flexFunctionConfigLoader() {
    try {
        const rootDirectory = process.cwd();
        const configPath = path.resolve(rootDirectory, 'flex-user-files/cfg/flexFunctionConfig.json');
        const configFile = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configFile);
        return config;
    } catch (err) {
        startup.error('Failed to load configuration expected at ./cfg/flexFunctionConfig.json');
        startup.error('Failed to load configuration:', err);
        process.exit(1); // Alternatively, you might want to throw an error instead of exiting.
    }
}


// Define the setEnvVar function
async function flexEnvInitializeVars(funcName) {

    try {

        //load the config into flexFunctionConfig
        var flexFunctionConfigObject = await flexFunctionConfigLoader();

        // Generate timestamp and UUID
        const start_sub_seconds = await moment().format('YYYYMMDDHHmmssSSS');
        const logUuid = uuidv4();
        const mqttAdminKey = `flexMqtt${uuidv4()}`;

        if (!flexFunctionConfigObject.flexFunctionMqttSupport) {
            flexFunctionConfigObject.flexFunctionMqttSupport = false;
        }
        if (!flexFunctionConfigObject.flexFunctionMqttServer) {
            flexFunctionConfigObject.flexFunctionMqttServer = '';
        }
        if (!flexFunctionConfigObject.flexFunctionMqttAdminTopic) {
            flexFunctionConfigObject.flexFunctionMqttAdminTopic = flexFunctionConfigObject.flexFunctionName.toLowerCase();
        }

        // Set the flexFunctionStartUp section in the JSON.  
        // This is where initialize can add any values assigned at startup
        if (!flexFunctionConfigObject.flexFunctionStartUp) {
            flexFunctionConfigObject.flexFunctionStartUp = {};
        }

        let refFlexStartUp = flexFunctionConfigObject.flexFunctionStartUp;
        refFlexStartUp.logPrefix = start_sub_seconds;
        refFlexStartUp.logUuid = logUuid;
        refFlexStartUp.mqttAdminKey = mqttAdminKey.replace(new RegExp('-', 'g'), '');

        //Is the function running in GCP?
        if (process.env.FUNCTION_NAME !== undefined ||
            process.env.FUNCTION_REGION !== undefined ||
            process.env.K_SERVICE !== undefined) {
            refFlexStartUp.envIsGcpCloudFunction = true;
            refFlexStartUp.envIsDcFunction = false;
            global.thisFlexFunctionLocation = 'GCP';
        } else {
            refFlexStartUp.envIsGcpCloudFunction = false;
            refFlexStartUp.envIsDcFunction = true;
            global.thisFlexFunctionLocation = 'DC';
        }

        // 2 values set to process.cwd()    
        refFlexStartUp.envProcessDirectroy = global.thisFlexFunctionRootDir = process.cwd();



        // Convert the JSON structure to a string
        const flexFunctionConfigString = JSON.stringify(flexFunctionConfigObject);
        const funcNameForEnvVar = flexFunctionConfigObject.flexFunctionName || funcName || 'NotFound';

        // Set the environment variable with the name based on funcName
        global.thisFlexFunctionConfig = flexFunctionConfigString;
        global.thisFlexFunctionConfigObject = flexFunctionConfigObject;

        startup.log(`Global variable thisFlexFuncConfigObject set to:`);
        startup.log(global.thisFlexFunctionConfigObject);

        global.thisFlexFunctionName = funcNameForEnvVar;

        global.thisFlexFunctionStatus = { Status: "Initialized", Time: Date.now() };
        global.thisFlexFunctionStartTime = new Date(Date.now());

        return funcNameForEnvVar;
    } catch (err) {
        startup.error('Error loading configuration or setting environment variable:');
        startup.error(err);
    } finally {
        //setup flexlog
        global.flexLogMqttAllowedLevel = flexFunctionConfigObject.flexFunctionLogConsole || 4;
        global.flexLogBaseAllowedLevel = flexFunctionConfigObject.flexFunctionLogConsole || 4;
        const flexlog = require('./flex-fw-env-flexlog');
        global.flexlog = flexlog;
        startup.log(global.flexlog);
    }
}

// Define the getEnvVars function
async function flexEnvGetVars() {
    try {
        // Retrieve the JSON string from the environment variable
        const jsonString = global.thisFlexFunctionConfig;

        // If the variable is not set, return null or handle the case accordingly
        if (!jsonString) {
            global.flexlog.error(`Global variable thisFlexFunctionConfig is not set.`);
            return null;
        }

        // Parse the JSON string to an object
        const jsonStructure = JSON.parse(jsonString);
        return jsonStructure;
    } catch (error) {
        console.error('Failed to retrieve or parse environment variable:', error);
        return null;
    }
}

// Define the addEnvVariable function
async function flexEnvAddVariable(varName, varValue) {
    if (typeof varName !== 'string') {
        throw new Error('Invalid input: varName should be a string.');
    }

    try {
        // Retrieve the existing JSON string from the environment variable
        let jsonString = global.thisFlexFunctionConfig;

        // Parse the JSON string into an object, or start with an empty object if not set
        let jsonStructure = jsonString ? JSON.parse(jsonString) : {};

        // Add the new key-value pair
        jsonStructure[varName] = varValue;

        // Convert the updated JSON structure back to a string
        jsonString = JSON.stringify(jsonStructure);

        // Set the updated JSON string back to the environment variable
        global.thisFlexFunctionConfig = jsonString;

        global.flexlog.debug(`Added ${varName}:${varValue} to global config.`);
    } catch (error) {
        global.flexlog.error('Failed to add variable to environment:', error);
    }
}

// Define the getEnvVariable function
async function flexEnvGetVariable(varName) {
    if (typeof varName !== 'string') {
        throw new Error('Invalid input: varName should be a string.');
    }

    try {
        // Retrieve the JSON string from the environment variable
        const jsonString = global.thisFlexFunctionConfig;

        // If the variable is not set, return null
        if (!jsonString) {
            global.flexlog.error(`Global variable thisFlexFunctionConfig is not set.`);
            return null;
        }

        // Parse the JSON string to an object
        const jsonStructure = JSON.parse(jsonString);

        // Return the specific value if it exists, otherwise return null
        return jsonStructure.hasOwnProperty(varName) ? jsonStructure[varName] : null;
    } catch (error) {
        global.flexlog.error('Failed to retrieve or parse specific environment variable:', error);
        return null;
    }
}

// Export the functions to be used in other modules
module.exports = {
    flexEnvInitializeVars,
    flexEnvGetVars,
    flexEnvAddVariable,
    flexEnvGetVariable
}