const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Define the setEnvVar function
function flexInitializeEnvVars(funcName) {
    if (typeof funcName !== 'string') {
        throw new Error('Invalid input: funcName should be a string.');
    }

    // Generate timestamp and UUID
    const start_sub_seconds = moment().format('YYYYMMDDHHmmssSSS');
    const logUuid = uuidv4();

    // Define the JSON structure
    const jsonStructure = {
        flexLogPrefix: start_sub_seconds,
        flexLogUuid: logUuid
    };

    try {
        // Convert the JSON structure to a string
        const jsonString = JSON.stringify(jsonStructure);

        // Set the environment variable with the name based on funcName
        process.env[funcName] = jsonString;

        console.log(`Environment variable ${funcName} set to:`, process.env[funcName]);
    } catch (error) {
        console.error('Failed to set environment variable:', error);
    }
}

// Define the getEnvVars function
function flexGetEnvVars(funcName) {
    if (typeof funcName !== 'string') {
        throw new Error('Invalid input: funcName should be a string.');
    }

    try {
        // Retrieve the JSON string from the environment variable
        const jsonString = process.env[funcName];

        // If the variable is not set, return null or handle the case accordingly
        if (!jsonString) {
            console.log(`Environment variable ${funcName} is not set.`);
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
function flexAddEnvVariable(funcName, varName, varValue) {
    if (typeof funcName !== 'string' || typeof varName !== 'string') {
        throw new Error('Invalid input: funcName and varName should be strings.');
    }

    try {
        // Retrieve the existing JSON string from the environment variable
        let jsonString = process.env[funcName];

        // Parse the JSON string into an object, or start with an empty object if not set
        let jsonStructure = jsonString ? JSON.parse(jsonString) : {};

        // Add the new key-value pair
        jsonStructure[varName] = varValue;

        // Convert the updated JSON structure back to a string
        jsonString = JSON.stringify(jsonStructure);

        // Set the updated JSON string back to the environment variable
        process.env[funcName] = jsonString;

        console.log(`Added ${varName} to environment variable ${funcName}.`);
    } catch (error) {
        console.error('Failed to add variable to environment:', error);
    }
}

// Define the getEnvVariable function
function flexGetEnvVariable(funcName, varName) {
    if (typeof funcName !== 'string' || typeof varName !== 'string') {
        throw new Error('Invalid input: funcName and varName should be strings.');
    }

    try {
        // Retrieve the JSON string from the environment variable
        const jsonString = process.env[funcName];

        // If the variable is not set, return null
        if (!jsonString) {
            console.log(`Environment variable ${funcName} is not set.`);
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
    flexInitializeEnvVars,
    flexGetEnvVars,
    flexAddEnvVariable,
    flexGetEnvVariable
}