const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Load configuration from JSON file
async function flexFunctionConfigLoader() {
    try {
        const rootDirectory = process.cwd();
        const configPath = path.resolve(rootDirectory, 'flex-user-files/cfg/flexFunctionConfig.json');
        const configFile = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configFile);
        return config;
    } catch (err) {
        console.error('Failed to load configuration expected at ./cfg/flexFunctionConfig.json');
        console.error('Failed to load configuration:', err);
        process.exit(1); // Alternatively, you might want to throw an error instead of exiting.
    }
}


// Define the setEnvVar function
async function flexEnvInitializeVars(funcName) {

    try {
        
        //load the config into flexFunctionConfig
        var flexFunctionConfig = await flexFunctionConfigLoader();

        // Generate timestamp and UUID
        const start_sub_seconds = await moment().format('YYYYMMDDHHmmssSSS');
        const logUuid = uuidv4();

        // Set the flexFunctionStartUp section in the JSON.  
        // This is where initialize can add any values assigned at startup
        if (!flexFunctionConfig.flexFunctionStartUp) {
            flexFunctionConfig.flexFunctionStartUp = {};
        }

        let refFlexStartUp = flexFunctionConfig.flexFunctionStartUp;
        refFlexStartUp.logPrefix = start_sub_seconds;
        refFlexStartUp.logUuid = logUuid;

        //Is the function running in GCP?
        if (process.env.FUNCTION_NAME !== undefined ||
            process.env.FUNCTION_REGION !== undefined ||
            process.env.K_SERVICE !== undefined )  {
                refFlexStartUp.envIsGcpCloudFunction = true;
                refFlexStartUp.envIsDcFunction = false;
            } else {
                refFlexStartUp.envIsGcpCloudFunction = false;
                refFlexStartUp.envIsDcFunction = true;
            }

        refFlexStartUp.envProcessDirectroy = process.cwd();
        

        // Convert the JSON structure to a string
        const jsonString = JSON.stringify(flexFunctionConfig);
        const funcNameForEnvVar = flexFunctionConfig.flexFunctionName || funcName || 'NotFound';

        // Set the environment variable with the name based on funcName
        global.thisFlexFunctionConfig = jsonString;

        console.log(`Global variable thisFlexFuncConfig set to:`, global.thisFlexFunctionConfig);

        global.thisFlexFunctionName = funcNameForEnvVar;

        return funcNameForEnvVar;
    } catch (err) {
        console.error('Error loading configuration or setting environment variable:', err);
    }
}

// Define the getEnvVars function
async function flexEnvGetVars() {
        //if (typeof funcName !== 'string') {
        //    throw new Error('Invalid input: funcName should be a string.');
        //}

        try {
            // Retrieve the JSON string from the environment variable
            const jsonString = global.thisFlexFunctionConfig;

            // If the variable is not set, return null or handle the case accordingly
            if (!jsonString) {
                console.log(`Global variable thisFlexFunctionConfig is not set.`);
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

            console.log(`Added ${varName} to global config.`);
        } catch (error) {
            console.error('Failed to add variable to environment:', error);
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
                console.log(`Global variable thisFlexFunctionConfig is not set.`);
                return null;
            }

            // Parse the JSON string to an object
            const jsonStructure = JSON.parse(jsonString);

            // Return the specific value if it exists, otherwise return null
            return jsonStructure.hasOwnProperty(varName) ? jsonStructure[varName] : null;
        } catch (error) {
            console.error('Failed to retrieve or parse specific environment variable:', error);
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