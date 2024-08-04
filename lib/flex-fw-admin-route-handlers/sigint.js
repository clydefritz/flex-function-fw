const flex_fw = require('../flex-fw-env-utils');

exports.sigint = function sigint(req, res) {
    
    console.log(`${process.env.thisFunctionName} received an interupt request`);
    console.log(`${process.env.thisFunctionName} attempting graceful shutdown...`);
    if (flex_fw.flexEnvGetVariable(process.env.thisFunctionName, 'flexFunctionStartUp.envIsDcFunction')) {
        process.emit('SIGINT');
        res.send("SIGINT requested");
    } else if (flex_fw.flexEnvGetVariable(process.env.thisFunctionName, 'flexFunctionStartUp.envIsGcpCloudFunction')) {
        process.env.thisFlexFunctionIsStopping = true;
        res.send("GCP Cloud Function draining state requested");
    }

};