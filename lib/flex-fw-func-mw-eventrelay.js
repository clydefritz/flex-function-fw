const fs = require('fs');
const path = require('path');

const { sendEvent } = require('./flex-fw-event-utils'); // Import sendEvent

// Load the exclude URIs from the intPortalExcludes.json file
let exclude = [];
const excludeFilePath = path.join(global.thisFlexFunctionRootDir, 'flex-user-files', 'cfg', 'flexIntPortalExcludes.json');

console.log('********************************************************');
console.log('>> ' + excludeFilePath);

try {
    // Read the file and parse the JSON content
    const excludeData = fs.readFileSync(excludeFilePath, 'utf8');
    exclude = JSON.parse(excludeData);
    console.log('Completed reading Int Portal Excludes');
} catch (err) {
    console.error(`Failed to load excludes from ${excludeFilePath}:`, err.message);
}

// Middleware function
const eventRelayMiddleware = async (req, res, next) => {

    console.log(req.headers);
    // Ensure exclude is an array and check if the request URI matches any of the exclude URIs
    var uriHolder;
    if (Array.isArray(exclude)) {
        const shouldExclude = exclude.some(uri => {
            uriHolder = uri;
            if (uri.includes('*')) {
                // Remove the '*' and use startsWith for matching
                const strippedUri = uri.replace('*', '');
                return req.originalUrl.startsWith(strippedUri);
            } else {
                // Exact match
                return req.originalUrl === uri;
            }
        });

        if (shouldExclude) {
            // If the URI matches an excluded one, skip the middleware and move to the next handler
            console.log(`Submitted uri: ${req.originalUrl} matched int portal exclude ${uriHolder}`);
            return next();
        }
    }

    var globalInstanceId = "";
    if (req.flexTrackingId) {
        globalInstanceId = req.flexTrackingId;
    } else {
        throw new Error("eventRelayMiddleware engaged but req.flexTrackingId was not set, so not able to set globalInstanceId.")
    }

    // Send "LogIn" event when the request is first received
    await sendEvent('LogIn', globalInstanceId, req.body);

    // Detect when the response is finished or closed and send "LogOut"
    res.on('finish', async () => {
        await sendEvent('LogOut', globalInstanceId, req.body);
    });

    //res.on('close', () => {
    //    sendEvent('LogOut', globalInstanceId, req.body);
    //});

    // Catch errors and send "LogError"
    res.on('error', (err) => {
        sendEvent('LogError', globalInstanceId, req.body, err.message || 'Unknown error');
    });

    // Continue to the next middleware/route handler
    next();
};

module.exports = eventRelayMiddleware;  