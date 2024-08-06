
function sigterm(req, res) {
    
    console.log(`${global.thisFlexFunctionName} received shutdown request`);
    console.log(`${global.thisFlexFunctionName} attempting graceful shutdown...`);
    console.log(`Flex Function location: ${global.thisFlexFunctionLocation}`);
    if (global.thisFlexFunctionLocation === 'DC') {
        process.emit('SIGTERM');
        res.send("SIGTERM requested");
    } else if (global.thisFlexFunctionLocation === 'GCP') {
        global.thisFlexFunctionIsStopping = true;
        global.thisFlexFunctionIsPaused = true;
        res.send("GCP Cloud Function draining state requested");
    }
    
};

module.exports = {sigterm};