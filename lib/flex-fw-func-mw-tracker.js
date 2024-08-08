const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Initialize a Map to hold currently in-process requests
global.inProcessRequests = new Map();

// Middleware to track requests
async function flexFuncMwRequestTracker(req, res, next) {
    const timePattern = 'YYYY-MM-DD HH:mm:ss.SSS';

    req.flexTrackingId = uuidv4();
    const requestDetails = {
        tid: req.flexTrackingId,
        ip: req.ip,
        ips: req.ips,
        type: req.protocol,
        verb: req.method,
        url: req.originalUrl,
        hdrs: req.headers,
        started: moment(Date.now()).format(timePattern),
        finished: null,
        error: false
    };

    global.inProcessRequests.set(req.flexTrackingId, requestDetails);

    // When the response is finished, update the finish time
    res.on('finish', () => {
        requestDetails.finished = moment(Date.now()).format(timePattern);
        if (res.statusCode >= 400) {
            requestDetails.error = true;
        }
        cleanUpOldRequests();
    });

    // If the connection is closed, also check for errors
    res.on('close', () => {
        if (!requestDetails.finished) {
            requestDetails.finished = moment(Date.now()).format(timePattern);
            if (res.statusCode >= 400) {
                requestDetails.error = true;
            }
            cleanUpOldRequests();
        }
    });

    next();
};

async function cleanUpOldRequests() {
    const timeTenMinutesAgo = Date.now() - 10 * 60 * 1000;
    global.inProcessRequests.forEach((value, key) => {
        if (value.finished && new Date(value.finished).getTime() < timeTenMinutesAgo) {
            global.inProcessRequests.delete(key);
        }
    });
}

module.exports = flexFuncMwRequestTracker;
