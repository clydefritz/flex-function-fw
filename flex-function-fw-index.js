const { flexEnvInitializeVars, flexEnvGetVars, flexEnvAddVariable, flexEnvGetVariable } = require('./lib/flex-fw-env-utils');
const { flexFunctionStart, flexFunctionStop } = require('./lib/flex-fw-func-main');



// Export all functions
module.exports = {
    flexEnvInitializeVars,
    flexEnvGetVars,
    flexEnvAddVariable,
    flexEnvGetVariable,
    flexFunctionStart,
    flexFunctionStop
}