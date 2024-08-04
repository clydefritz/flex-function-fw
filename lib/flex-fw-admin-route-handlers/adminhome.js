exports.adminhome = function adminhome(req, res) {
    
    res.send(`You've arrived at the flex admin home for ${process.env.thisFunctionName}`);

};