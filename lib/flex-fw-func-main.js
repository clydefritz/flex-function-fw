const express = require('express');
const flexFunction = express();
const fw_env = require('./flex-fw-env-utils');

async function flexFunctionStart(){
    console.log('Entered flex function start');
    await fw_env.flexEnvInitializeVars();
    console.log('Line after await flexEnvInitializeVars');
    const flexFunctionRouter = require('./flex-fw-func-router');

    flexFunction.use(flexFunctionRouter);

    if (fw_env.flexEnvGetVariable(process.env.thisFunctionName, 'envIsDcFunction')) {
        await startFlexFunctionDcListener();
    }
    
}

// Starting the express app as dc_app (data center app) if not in GCP
async function startFlexFunctionDcListener() {
    const thisFlexFunctionName = process.env.thisFunctionName;
    var cFlexFunctionDcPort = await fw_env.flexEnvGetVariable(thisFlexFunctionName, 'flexFunctionDcPort');
    if (fw_env.flexEnvGetVariable(thisFlexFunctionName, 'flexFunctionStartUp.envIsDcFunction')) {
        await new Promise((resolve, reject) => {
            if (!cFlexFunctionDcPort) {
                cFlexFunctionDcPort = 8080;
            }
            
            flexFunction.listen(cFlexFunctionDcPort, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`${thisFlexFunctionName} is listening on port ${cFlexFunctionDcPort}`);
                    resolve();
                }
            });
        });
    } else {
        return true;
    }
}

module.exports = {
    flexFunctionStart
};