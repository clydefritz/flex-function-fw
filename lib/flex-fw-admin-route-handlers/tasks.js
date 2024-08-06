
function tasks(req, res) {

    console.log(`${global.thisFlexFunctionName} received resume request`);

    global.thisFlexFunctionIsPaused = false;
    res.send("Flex Function resume requested.  Resuming active processing of requests.");

};

module.exports = { tasks };