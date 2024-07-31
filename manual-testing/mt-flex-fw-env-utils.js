const { setEnvVar, getEnvVars, addEnvVariable, getEnvVariable } = require('../lib/flex-fw-env-utils');

setEnvVar('MY_ENV_VAR');

let envVars = getEnvVars('MY_ENV_VAR');
console.log(envVars);

addEnvVariable('MY_ENV_VAR', 'newTestKey', 'newTestValue');

const value = getEnvVariable('MY_ENV_VAR', 'newTestKey');

console.log(value);

envVars = getEnvVars('MY_ENV_VAR');
console.log(envVars);