var colors = require('colors/safe');

function error (msg) {
    console.log(colors.bgRed(msg));
}

function info (msg1, msg2) {
    console.log(msg1, colors.blue(msg2 ? ': ' + msg2 : ''));
}

module.exports = {
    error,
    info
};
