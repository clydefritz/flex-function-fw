const { flexEnvInitializeVars, flexEnvGetVars, flexEnvAddVariable, flexEnvGetVariable } = require('../lib/flex-fw-env-utils');

async function main() {
    const myName = await flexEnvInitializeVars();
    console.log(`I am ${myName}`);

    let envVars = await flexEnvGetVars(myName);
    console.log(envVars);

    await flexEnvAddVariable('newTestKey', 'newTestValue');

    const value = await flexEnvGetVariable('newTestKey');

    console.log(value);

    envVars = flexEnvGetVars(myName);
    console.log(envVars);


}

main();