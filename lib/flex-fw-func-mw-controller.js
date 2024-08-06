
async function isThisFlexFuncStopping(req, res) {
    console.log('Request checker middleware started ...');

    // Allow any request with a URI that includes /flex to proceed
    if (req.path.startsWith('/flex')) {
        return true;
    }

    if (global.thisFlexFunctionIsPaused === true) {
        console.log(`This flexFunctionIsStopping = ${global.thisFlexFunctionIsStopping}`);
        const flexFunctionStatusJson = {
            function: 'unavailable',
            reason: 'flex function is currently paused and draining existing requests.  No new requests allowed.'
        }
        res.status(503).json({ flexFunctionStatusJson });
        return false; // Indicate that the request should not proceed
    }
    return true; // Indicate that the request can proceed
}



// Controller middleware that coordinates the request flow
async function flexMwController(req, res, next) {
    try {
        var flexFuncShouldProceed = true;
        flexFuncShouldProceed = await isThisFlexFuncStopping(req, res);
        
        if (flexFuncShouldProceed) {
            // next check would go here
            //shouldProceed = await flexNextRequestCheck(req, res);
        }
        
        if (flexFuncShouldProceed) {
            next(); // Proceed to the next middleware or route handler
        }
        // If shouldProceed is false, the response has been sent by flexRequestCheckerMw
    } catch (err) {
        console.error('Error in middleware:', err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = flexMwController;
