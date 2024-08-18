const fw_env = require('./flex-fw-env-utils');
const axios  = require('axios');
const http   = require('http');
const https  = require('https');

// sendEvent function
const sendEvent = async (logType, globalInstanceId, reqBody, errorData = '', additionalData = {}) => {
    const isOk = await fw_env.flexEnvGetVariable('flexFunctionIntPortalActive');
    console.log(`isOk ${isOk}`);
    const axiosDebugRequested = await fw_env.flexEnvGetVariable('flexFunctionIntPortalDebug');
    console.log(`debug ${axiosDebugRequested}`);
    const rejectBadCertOnRelayRequest = await fw_env.flexEnvGetVariable('flexFunctionIntPortalRejectBadCert');

    //prep params
    reqBody = reqBody || "";

    if (!isOk) {
        throw new Error("sendEvent was called but flexFunctionIntPortalActive in config was not = true")
    }
    if (axiosDebugRequested) {
        console.log("*************************************************************");
        console.log(`** Axios Debug For logType: ${logType}`);
        console.log("*************************************************************");
        console.log("");
    }
    try {
        const eventData = {
            EsbEventRelayRequest: {
                Event: {
                    globalInstanceId: globalInstanceId,
                    extendedDataElements: {
                        TargetSystemInfo: {
                            TargetSystemID: "FLEX",
                        },
                        SourceSystemInfo: {
                            SourceSystemID: "FLEX",
                        },
                        TransactionInfo: {
                            logType: logType,
                        },
                        TransportHeaderInfo: {
                            TransportType: "HTTP",
                        },
                        customAttributes: {
                            flexTest: "true",
                            flexField: "hello"
                        },
                        eventGeneratorInfo: {
                            ipProjectId: "ESB",
                            ipComponentId: "esbflex.Test",
                            ExecutionEnvironment: "ExecEnvName",
                            ServerId: "serverId",
                            ProcessId: reqBody.ProcessId || "",
                        },
                        RawData: {
                            msgData: JSON.stringify(reqBody),
                            errorData: errorData,
                        },
                        ...additionalData // Additional fields to allow flexibility
                    },
                },
            },
        };

        if (axiosDebugRequested) {
            console.log("Event Relay JSON looks like the following:");
            console.log(JSON.stringify(eventData, null, 2));
            console.log(`Reject Bad Event Relay Cert: ${rejectBadCertOnRelayRequest}`)
        }
        const targetUrl = await fw_env.flexEnvGetVariable('flexFunctionIntPortalRelayUrl');
        if (!targetUrl) {
            throw new Error("flexFunctionIntPortalRelayUrl not found in flex config")
        }

        // Set up Basic Authentication credentials
        const rsUsername = await fw_env.flexEnvGetVariable('flexFunctionIntPortalRelayUname');
        const rsPassword = await fw_env.flexEnvGetVariable('flexFunctionIntPortalRelayPw');
        var rsBasicAuth;
        if (rsUsername && rsPassword) {
            rsBasicAuth = Buffer.from(`${rsUsername}:${rsPassword}`).toString('base64');
        }

        // Create the headers object
        const rsHeaders = {
            'Content-Type': 'application/json',
        };

        // Conditionally add the Authorization header if basicAuth is provided
        if (rsBasicAuth) {
            rsHeaders['Authorization'] = `Basic ${rsBasicAuth}`;
        }

        const rsRejectBadCert = (typeof rejectBadCertOnRelayRequest !== 'undefined') ? rejectBadCertOnRelayRequest : true;

        const agent = targetUrl.startsWith('https')
            ? new https.Agent({
                rejectUnauthorized: rsRejectBadCert,
            })
            : new http.Agent();

        // Send the event to the target URL with headers including basic auth if provided along with proper agent
        await axios.post(targetUrl, eventData, {
            headers: rsHeaders,
            httpAgent: !targetUrl.startsWith('https') ? agent : undefined, // Set for HTTP requests
            httpsAgent: targetUrl.startsWith('https') ? agent : undefined, // Set for HTTPS requests
        });

        console.log(`Event with logType: ${logType} sent successfully`);
    } catch (error) {
        console.error(`Error sending event with logType: ${logType}`);
        if (axiosDebugRequested) {
            console.log("** Axios Debug Dump:");
            console.error(error);
            console.log("")
        } else {
            console.error(`${error.code} for ${error.config.url}`);
        }
    }
};

// Export the sendEvent function so other modules can use it
module.exports = { sendEvent };
