const Runner = require('./runner');

function run (suitPath, options) {
    const runner = new Runner(suitPath, options);
    runner.run();
}

module.exports = {
    run
};
