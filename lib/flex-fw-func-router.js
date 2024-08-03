// router.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const fw_env = require('./flex-fw-env-utils');
const requestLogger = require('./flex-fw-func-receipt-logger');

const flexFunctionRouter = express.Router();

// Function to load all handlers from the handlers directory
function loadHandlers(dir) {
  const handlers = {};
  fs.readdirSync(dir).forEach(file => {
    if (path.extname(file) === '.js') {
      const handlerModule = require(path.join(dir, file));
      const handlerName = path.basename(file, '.js');

      if (typeof handlerModule === 'function') {
        handlers[handlerName] = handlerModule;
      } else if (typeof handlerModule === 'object') {
        handlers[handlerName] = handlerModule[handlerName];
      } else {
        console.error(`Handler for "${handlerName}" is not a function or object.`);
      }
    }
  });
  return handlers;
}

// Directory containing handler files
const rootDirectory = process.cwd();
const handlersDir = path.join(rootDirectory, 'flex-user-files/route-handlers');
console.log(`flow-handlers dir: ${handlersDir}`);

async function mainRouter() {
  try {
    // Ensure the function name is defined
    const functionName = process.env.thisFunctionName;
    if (!functionName) {
      throw new Error('The environment variable "thisFunctionName" is not set.');
    }

    // Load all handlers from the handlers directory
    console.log(`About to load handlers`);
    const handlers = loadHandlers(handlersDir);

    // Load the JSON configuration from ENV
    console.log(`This function name: ${functionName}`);
    const thisFlexFuncConfig = await fw_env.flexEnvGetVars(functionName);
    console.log('Configuration loaded:', thisFlexFuncConfig);

    // Use Receipt Logging
    // Set up logging options
    const loggingOptions = {
      console: true,
      file: true,
      filename: 'flexfunc.log',
      gcp: false,
      gcpLogName: 'myapp-log',
    };

    // Use the logging middleware
    flexFunctionRouter.use(requestLogger(loggingOptions));

    // Iterate over the routes in the configuration and create them
    thisFlexFuncConfig.flexFunctionRoutes.forEach(route => {
      const method = route.method.toLowerCase();
      const routePath = route.path;
      const handler = handlers[route.handler];

      if (handler) {
        flexFunctionRouter[method](routePath, handler);
        console.log(`Route registered: ${method.toUpperCase()} ${routePath}, handler: ${route.handler}`);
      } else {
        console.error(`Handler for "${route.handler}" not found.`);
      }
    });

    // Log the final router setup
    console.log('*********************************');
    logRouterSetup(flexFunctionRouter);

  } catch (error) {
    console.error('Error setting up routes:', error);
  }
}

// Function to log the router's final setup
function logRouterSetup(router) {
  console.log('Final Router Setup:');
  router.stack.forEach(layer => {
    if (layer.route) {
      // Extract the path, method, and handler name
      const path = layer.route.path;
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      const handlerName = layer.route.stack[0].handle.name || 'anonymous';

      console.log(`Method: ${method}, Path: ${path}, Handler: ${handlerName}`);
    }
  });
}

// Export the router after setting up
mainRouter()
  .then(() => {
    console.log('Router setup complete.');
  })
  .catch(err => {
    console.error('Error in mainRouter:', err);
  });

module.exports = flexFunctionRouter;
