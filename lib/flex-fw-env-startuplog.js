// flex-fw-env-startuplog.js

const startupPrefix       = 'STARTUP > ';
const startupErrorPrefix  = 'ERROR > ';
const startup = () => {};
const now = new Date();

startup.initializelog = function () {
    console.clear();
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('******************************************************');
    console.log(`**  FLEX FUNCTION START @ ${now.toISOString()}  **`);
    console.log('******************************************************');
    console.log('');
}


startup.log = function (message) {
    if (typeof message === 'string') {
        console.log(`${startupPrefix}${message}`);
    } else {
        console.log(`${startupPrefix}`);
        console.log(message);
    }
}

startup.error = function (message) {
    console.error(`${startupErrorPrefix}${message}`);
}

module.exports = startup;