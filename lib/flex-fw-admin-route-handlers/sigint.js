const flex_fw = require('../flex-fw-env-utils');

exports.sigint = function sigint(req, res) {
    
    console.log(`${global.thisFlexFunctionName} received an interupt request`);
    console.log(`${global.thisFlexFunctionName} attempting graceful shutdown...`);
    if (flex_fw.flexEnvGetVariable('flexFunctionStartUp.envIsDcFunction')) {
        process.emit('SIGINT');
        res.send("SIGINT requested");
    } else if (flex_fw.flexEnvGetVariable('flexFunctionStartUp.envIsGcpCloudFunction')) {
        process.env.thisFlexFunctionIsStopping = true;
        res.send("GCP Cloud Function draining state requested");
    }

};