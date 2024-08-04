const flex_fw = require('../flex-fw-env-utils');


exports.sigterm = function sigterm(req, res) {
    
    console.log(`${process.env.thisFunctionName} received shutdown request`);
    console.log(`${process.env.thisFunctionName} attempting graceful shutdown...`);
    if (flex_fw.flexEnvGetVariable(process.env.thisFunctionName, 'flexFunctionStartUp.envIsDcFunction')) {
        process.emit('SIGTERM');
        res.send("SIGTERM requested");
    } else if (flex_fw.flexEnvGetVariable(process.env.thisFunctionName, 'flexFunctionStartUp.envIsGcpCloudFunction')) {
        process.env.thisFlexFunctionIsStopping = true;
        res.send("GCP Cloud Function draining state requested");
    }
    
};