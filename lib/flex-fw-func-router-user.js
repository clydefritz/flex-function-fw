const express = require('express');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const fw_env = require('./flex-fw-env-utils');

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
// Directory containing the IP filtering files
const ipsDir = path.join(rootDirectory, 'flex-user-files/route-ips');
console.log(`route-ips dir: ${ipsDir}`);


// Function to load IP filtering data if it exists
function loadIpFilterConfig(routePath) {
  const ipConfigFile = path.join(ipsDir, `${routePath}.ips.json`);
  if (fs.existsSync(ipConfigFile)) {
    const ipConfig = JSON.parse(fs.readFileSync(ipConfigFile, 'utf8'));
    return ipConfig;
  }
  return null;
}

// Custom IP filtering middleware
function ipFilterMiddleware(allowedIps, blockedIps) {
  return function (req, res, next) {
    const clientIp = req.ip;

    // Helper function to check if an IP matches an array of IPs (with wildcard * support)
    function matchesIp(ipList, ip) {
      return ipList.some(listIp => {
        if (listIp.includes('*')) {
          const prefix = listIp.replace('*', ''); // Remove '*' and treat as a prefix
          return ip.startsWith(prefix);
        }
        return listIp === ip;
      });
    }

    // If allowed IPs are defined, only allow those IPs
    if (allowedIps && allowedIps.length > 0) {
      if (!matchesIp(allowedIps, clientIp)) {
        return res.status(403).send(`Access denied. Your IP ${clientIp} is not allowed.`);
      }
      // If blocked IPs are defined, deny those IPs
    } else if (blockedIps && blockedIps.length > 0) {
      if (matchesIp(blockedIps, clientIp)) {
        return res.status(403).send(`Access denied. Your IP ${clientIp} is blocked.`);
      }
    }

    next();
  };
}

async function mainRouter() {
  try {
    // Ensure the function name is defined
    const functionName = global.thisFlexFunctionName;
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

    // Iterate over the routes in the configuration and create them
    thisFlexFuncConfig.flexFunctionRoutes.forEach(route => {
      const method = route.method.toLowerCase();
      const routePath = route.path;
      const handler = handlers[route.handler];
      const routeParser = route.parser?.toUpperCase();

      const parsers = {
        'JSON': express.json(),
        'RAW': express.raw(),
        'TEXT': express.text(),
        'URL': express.urlencoded({ extended: true }),
        'XML': require('express-xml-bodyparser')()
      };

      const parserForRoute = parsers[routeParser];

      if (handler) {
        const middlewareArray = [];

        // Add optional rate limiting middleware
        if (route.rateLimitCount && route.rateLimitSeconds) {
          const rateLimiter = rateLimit({
            windowMs: route.rateLimitSeconds * 1000, // convert seconds to milliseconds
            max: route.rateLimitCount, // max requests per windowMs
            message: `Too many requests. Please try again after ${route.rateLimitSeconds} seconds.`
          });
          middlewareArray.push(rateLimiter);
          console.log(`Rate limit applied: ${route.rateLimitCount} requests per ${route.rateLimitSeconds} seconds`);
        }

        // Add optional parser middleware
        if (route.parser) {
          middlewareArray.push(parserForRoute);
        }

        // Add IP filtering if IP filter config exists for this route
        const ipFilterConfig = loadIpFilterConfig(routePath);
        if (ipFilterConfig) {
          // Validate if both ipsAllowed and ipsBlocked are provided
          if (ipFilterConfig.ipsAllowed &&
            ipFilterConfig.ipsAllowed.length > 0 &&
            ipFilterConfig.ipsBlocked &&
            ipFilterConfig.ipsBlocked.length > 0
          ) {
            console.warn(`Warning: Both "ipsAllowed" and "ipsBlocked" are provided in ${routePath}.ips.json. Only "ipsAllowed" will be applied.`);
          }

          // Apply IP filtering middleware
          const allowedIps = ipFilterConfig.ipsAllowed || [];
          const blockedIps = ipFilterConfig.ipsBlocked || [];

          middlewareArray.push(ipFilterMiddleware(allowedIps, blockedIps));

          console.log(`IP filtering applied for route ${routePath}`);
        }

        // Add handler middleware
        middlewareArray.push(handler);

        // Register the route with the specified method, path, and middleware chain
        flexFunctionRouter[method](routePath, ...middlewareArray);

        console.log(`Route registered: ${method.toUpperCase()} ${routePath}, handler: ${route.handler}, parser: ${route.parser}, rate limit: ${route.rateLimitCount ? route.rateLimitCount : 'none'} requests per ${route.rateLimitSeconds ? route.rateLimitSeconds : 'N/A'} seconds`);
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
