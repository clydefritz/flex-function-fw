function sigint(req, res) {
    
    console.log(`${global.thisFlexFunctionName} received shutdown request`);
    console.log(`${global.thisFlexFunctionName} attempting graceful shutdown...`);
    console.log(`Flex Function location: ${global.thisFlexFunctionLocation}`);
    if (global.thisFlexFunctionLocation === 'DC') {
        process.emit('SIGINT');
        res.send("SIGINT requested");
    } else if (global.thisFlexFunctionLocation === 'GCP') {
        global.thisFlexFunctionIsStopping = true;
        res.send("GCP Cloud Function draining state requested");
    }
    
};

module.exports = {sigint};