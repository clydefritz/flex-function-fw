exports.sigint = function sigint(req, res) {
    
    console.log(`${process.env.thisFunctionName} received an interupt request`);
    console.log(`${process.env.thisFunctionName} attempting graceful shutdown...`);
    process.emit('SIGINT');
    
    res.send("SIGINT requested");

};