const fs = require('fs');
const { Logging } = require('@google-cloud/logging');
const winston = require('winston');

const logging = new Logging();

const logToConsole = (message) => {
  console.log(message);
};

const logToFile = (message, filename) => {
  fs.appendFile(filename, `${message}\n`, (err) => {
    if (err) throw err;
  });
};

const logToGCP = async (message, logName) => {
  const log = logging.log(logName);
  const metadata = {
    resource: { type: 'global' },
  };
  const entry = log.entry(metadata, { message });
  await log.write(entry);
};

const requestLogger = (options) => {
  return async (req, res, next) => {
    const logMessage = `${req.method} ${req.url} ${new Date().toISOString()}`;
    
    if (options.console) {
      logToConsole(logMessage);
    }

    if (options.file) {
      logToFile(logMessage, options.filename || 'requests.log');
    }

    if (options.gcp) {
      try {
        await logToGCP(logMessage, options.gcpLogName || 'express-log');
      } catch (error) {
        console.error('Failed to log to GCP:', error);
      }
    }

    next();
  };
};

module.exports = requestLogger;
