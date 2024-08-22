// flex-fw-env-mqttlog.js


/**
 * Logs a message and optionally an object at the specified log level.
 * The log type can be 'log', 'warn', or 'error', which determines which
 * console method to use.
 * 
 * @param {string} message - The message to be logged.
 * @param {Object} [object={}] - An optional object to log alongside the message.
 * @param {number} [loglevel=1] - The log level (optional, defaults to 1).
 * If the log level is higher or equal to `flexFunctionMqttDebugLog`, the message and object are logged.
 * @param {string} [msgtype='log'] - The type of log ('log', 'warn', or 'error').
 */

const flexlog = function (message = '', object = {}, loglevel = 2, msgtype = 'info', logtype = 'base') {

    var allowedLogLevel = 0;
    if (logtype === 'mqtt') {
        allowedLogLevel = global.flexLogMqttAllowedLevel || 2;
    } else if (logtype === 'base') {
        //base log
        allowedLogLevel = global.flexLogBaseAllowedLevel || 2;
    } else {
        throw new Error(`flexlog: invalid logtype '${logtype}' provided.  Valid options include 'base' or 'mqtt'.`);
    }


    if (allowedLogLevel >= loglevel) {
        // Check if loglevel is a number
        if (typeof loglevel !== 'number' || isNaN(loglevel)) {
            throw new Error("flexlog: loglevel should be a valid number.");
        }

        // Check if message is a string
        if (typeof message !== 'string') {
            throw new Error("flexlog: Log message should be a string.");
        }

        // Ensure type is one of 'log', 'warn', or 'error'
        if (!['info', 'warn', 'error', 'debug', 'log'].includes(msgtype)) {
            throw new Error("flexlog: msgtype is required to be one of 'error'(0), 'warn'(1), 'log'(2), 'info'(3), or 'debug'(4).");
        }

        var msgTypePrefix = '';
        if (global.thisFlexFunctionLocation === 'DC') {
            msgTypePrefix = `${msgtype.toUpperCase()} > `;
        } else {
            msgTypePrefix = ``;
        }


        if (Object.keys(object).length > 0) {
            console[msgtype](`${msgTypePrefix}${message}`, object);  // Log the message with the object using the appropriate console method
        } else {
            console[msgtype](`${msgTypePrefix}${message}`);  // Log only the message using the appropriate console method
        }
    }
};

// Add shortcut methods to flexlog
flexlog.error = function (message, object = {}) {
    flexlog(message, object, 0, 'error', 'base');
};

flexlog.warn = function (message, object = {}) {
    flexlog(message, object, 1, 'warn', 'base');
};

flexlog.log = function (message, object = {}) {
    flexlog(message, object, 2, 'log', 'base');
};

flexlog.info = function (message, object = {}) {
    flexlog(message, object, 3, 'info', 'base');
};

flexlog.debug = function (message, object = {}) {
    flexlog(message, object, 4, 'debug', 'base');
};

// MQTT-specific methods (for 'mqtt' log type)
flexlog.mqtt = {};
flexlog.mqtt.error = function (message, object = {}) {
    flexlog(message, object, 0, 'error', 'mqtt');
};

flexlog.mqtt.warn = function (message, object = {}) {
    flexlog(message, object, 1, 'warn', 'mqtt');
};

flexlog.mqtt.log = function (message, object = {}) {
    flexlog(message, object, 2, 'log', 'mqtt');
};

flexlog.mqtt.info = function (message, object = {}) {
    flexlog(message, object, 3, 'info', 'mqtt');
};

flexlog.mqtt.debug = function (message, object = {}) {
    flexlog(message, object, 4, 'debug', 'mqtt');
};

console.log(flexlog);

// Export the flexlog function
module.exports = flexlog;
