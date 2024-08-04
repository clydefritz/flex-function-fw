const flex_fw = require('../flex-fw-env-utils');


exports.sigterm = function sigterm(req, res) {
    
    console.log(`${global.thisFlexFunctionName} received shutdown request`);
    console.log(`${global.thisFlexFunctionName} attempting graceful shutdown...`);
    if (flex_fw.flexEnvGetVariable('flexFunctionStartUp.envIsDcFunction')) {
        process.emit('SIGTERM');
        res.send("SIGTERM requested");
    } else if (flex_fw.flexEnvGetVariable('flexFunctionStartUp.envIsGcpCloudFunction')) {
        process.env.thisFlexFunctionIsStopping = true;
        res.send("GCP Cloud Function draining state requested");
    }
    
};