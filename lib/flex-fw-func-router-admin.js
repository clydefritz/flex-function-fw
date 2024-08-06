// admin router.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const fw_env = require('./flex-fw-env-utils');


const flexFunctionRouterAdmin = express.Router();

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
//const rootDirectory = process.cwd();
//const handlersDir = path.join(rootDirectory, 'flex-user-files/route-handlers');
const flexFwAdminHandlerDir = path.join(__dirname, 'flex-fw-admin-route-handlers');;
console.log(`flex-admin-route-handlers dir: ${flexFwAdminHandlerDir}`);

async function mainAdminRouter() {
    try {
        // Ensure the function name is defined
        const functionName = global.thisFlexFunctionName;
        if (!functionName) {
            throw new Error('The environment variable "thisFunctionName" is not set.');
        }

        // Load all handlers from the handlers directory
        console.log(`About to load flex admin handlers`);
        const handlers = loadHandlers(flexFwAdminHandlerDir);


        // Load the JSON admin configuration from a file
        const adminConfigFilePath = path.join(__dirname, 'flex-fw-admin-route-handlers', '_flex-fw-admin-route-config.json');
        console.log(`Reading admin configuration from: ${adminConfigFilePath}`);

        let thisFlexFuncAdminConfig;

        try {
            const adminConfigFileContent = fs.readFileSync(adminConfigFilePath, 'utf-8');
            thisFlexFuncAdminConfig = JSON.parse(adminConfigFileContent);
            console.log('Admin configuration loaded:', thisFlexFuncAdminConfig);
        } catch (error) {
            console.error('Error reading admin configuration file:', error);
            throw error;
        }

        // Iterate over the routes in the configuration and create them
        thisFlexFuncAdminConfig.flexFunctionAdminRoutes.forEach(adminroute => {
            const method = adminroute.method.toLowerCase();
            const routePath = adminroute.path;
            const handler = handlers[adminroute.handler];
            const adminRouteParser = adminroute.parser?.toUpperCase();

            const parsers = {
                'JSON': express.json(),
                'RAW': express.raw(),
                'TEXT': express.text(),
                'URL': express.urlencoded({ extended: true }),
                'XML': require('express-xml-bodyparser')()
            };

            const parserForRoute = parsers[adminRouteParser];

            if (handler) {
                // Check if the route has an optional parser defined
                if (adminroute.parser) {
                    // Include the parser in the route setup if it is not falsy
                    flexFunctionRouterAdmin[method](routePath, parserForRoute, handler);
                } else {
                    // Set up the route without a parser
                    flexFunctionRouterAdmin[method](routePath, handler);
                }
                console.log(`Route registered: ${method.toUpperCase()} ${routePath}, handler: ${adminroute.handler}, parser: ${adminroute.parser}`);
            } else {
                console.error(`Handler for "${adminroute.handler}" not found.`);
            }
        });

        // Log the final router setup
        console.log('**********************************');
        logRouterSetup(flexFunctionRouterAdmin);

    } catch (error) {
        console.error('Error setting up admin routes:', error);
    }
}

// Function to log the router's final setup
function logRouterSetup(router) {
    console.log('Final Admin Router Setup:');
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
mainAdminRouter()
    .then(() => {
        console.log('Admin router setup complete.');
    })
    .catch(err => {
        console.error('Error in mainAdminRouter:', err);
    });

module.exports = flexFunctionRouterAdmin;
