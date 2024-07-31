const { flexInitializeEnvVars, flexGetEnvVars, flexAddEnvVariable, flexGetEnvVariable } = require('../lib/flex-fw-env-utils');

flexInitializeEnvVars('MY_ENV_VAR');

let envVars = flexGetEnvVars('MY_ENV_VAR');
console.log(envVars);

flexAddEnvVariable('MY_ENV_VAR', 'newTestKey', 'newTestValue');

const value = flexGetEnvVariable('MY_ENV_VAR', 'newTestKey');

console.log(value);

envVars = flexGetEnvVars('MY_ENV_VAR');
console.log(envVars);