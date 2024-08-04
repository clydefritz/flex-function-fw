exports.sigterm = function sigterm(req, res) {
    
    console.log(`${process.env.thisFunctionName} received shutdown request`);
    console.log(`${process.env.thisFunctionName} attempting graceful shutdown...`);
    process.emit('SIGTERM');
    
    res.send("SIGTERM requested");

};