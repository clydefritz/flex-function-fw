const flexFunctionFw = require('./flex-function-fw-index');
var gcpfunctions_fw = require('@google-cloud/functions-framework');
let thisFlexFunction = undefined;

async function flexFunctionMain() {
   thisFlexFunction = await flexFunctionFw.flexFunctionStart();
   // Register an HTTP function with the Functions Framework that will be executed
   // when you make an HTTP request to the deployed function's endpoint.
   gcpfunctions_fw.http('default-function', thisFlexFunction);
}

flexFunctionMain();

