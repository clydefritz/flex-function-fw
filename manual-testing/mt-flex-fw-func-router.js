const express = require('express');
const flexFunction = express();
const fw_env = require('../lib/flex-fw-env-utils');

async function main(){
    await fw_env.flexEnvInitializeVars();

    const flexFunctionRouter = require('../lib/flex-fw-func-router-user');

    flexFunction.use(flexFunctionRouter);

    await startDcListener();


}

// Starting the express app as dc_app (data center app) if not in GCP
async function startDcListener() {
    if (fw_env.flexEnvGetVariable('flexFunctionStartUp.envIsDcFunction')) {
        await new Promise((resolve, reject) => {
            const cFlexFunctionDcPort = process.env[global.thisFlexFunctionName].flexFunctionDcPort || 8080;
            flexFunction.listen(cFlexFunctionDcPort, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Example app listening on port ${cFlexFunctionDcPort}`);
                    resolve();
                }
            });
        });
    } else {
        return true;
    }
}

main();