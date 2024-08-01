const { flexEnvInitializeVars, flexEnvGetVars, flexEnvAddVariable, flexEnvGetVariable } = require('../lib/flex-fw-env-utils');

async function main() {
    flexEnvInitializeVars('MY_ENV_VAR');

    let envVars = flexEnvGetVars('MY_ENV_VAR');
    console.log(envVars);

    flexEnvAddVariable('MY_ENV_VAR', 'newTestKey', 'newTestValue');

    const value = flexEnvGetVariable('MY_ENV_VAR', 'newTestKey');

    console.log(value);

    envVars = flexEnvGetVars('MY_ENV_VAR');
    console.log(envVars);
}

main();