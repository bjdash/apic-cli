// @ts-check
const ora = require('ora');
const Table = require('cli-table3');
const Constants = require('../constants');
const colors = require('colors/safe');
const utils = require('../utils');

var spinner;
const configs = {
    shouldLogResponseData: false
}
function init (eventEmitter, options) {
    options.responseData && (configs.shouldLogResponseData=true);
    eventEmitter.on(Constants.events.TEST_START, onTestStart);
    eventEmitter.on(Constants.events.REQ_RUN_START, onRequestRunStart);
    eventEmitter.on(Constants.events.REQ_RUN_END, onRequestRunEnd);
    eventEmitter.on(Constants.events.TEST_FINISHED, onTestFinished);
}

function onTestStart (suit) {
    console.log('Running suit: ', colors.blue(suit.name));
}

function onRequestRunStart (req) {
    spinner = ora(req.name).start();
}

function onRequestRunEnd (api) {
    (api.response.status === 0 || api.scriptError) ? spinner.fail() : spinner.succeed();
    var testStat = {
        passed: 0,
        failed: 0
    };

    // console.log('\n');
    var time = api.response.timeTaken >= 1000 ? ((api.response.timeTaken / 1000) + ' s') : (api.response.timeTaken + ' ms');
    var statusStr = api.response.statusText + ' (' + api.response.status + ')';
    statusStr = api.response.status.toString().charAt(0) === '2' ? colors.green(statusStr) : colors.red(statusStr).toString();

    // term.bold('\n► ' + api.request.name).right(25)('[ ' + statusStr + '  ' + time + ' ]\n');
    console.log(colors.dim('  ' + api.request.method + '  ' + api.request.url + '    [ ' + statusStr + '  ' + time + ' ]'));

    if(configs.shouldLogResponseData){
        console.log('  '+colors.underline('Response:')+utils.toString(api.response.data || api.response.body))
    }

    
    if (api.TESTS) {
        console.log('\n');

        api.TESTS.forEach(function(test){
            var testStr = '';
            if (test.success) {
                testStat.passed++;
                testStr = colors.bgGreen('   PASSED   ');
                console.log('  ' + testStr + '  ' + test.name);
            } else {
                testStat.failed++;
                testStr = colors.bgRed('   FAILED   ');
                console.log('  ' + testStr + '  ' + test.name);
                console.log('                '+ colors.red(test.reason))
            }
        })
    }

    if(api.scriptError){
        console.log(`\n  ${colors.white.bgRed('Script error:')}`)
        console.log(`  ${colors.red(api.scriptError)}`)
    }

    if(api.logs){
        console.log(`\n  ${colors.underline('Run logs:')}`)
        console.log('  '+api.logs.replace(/\n/g, '\n  '))
    }

    console.log('\n');
}

function onTestFinished (runResult) {
    console.log('Finished running suit');

    const stats = runResult.stats;
    var table = new Table({
        head: ['', colors.green('Success'), colors.red('Failed'), colors.reset('Total')],
        colWidths: [30, 10, 10, 10]
    });

    // @ts-ignore
    table.push(['Requests', stats.requestsTotal - stats.requestsFail, stats.requestsFail, stats.requestsTotal]);
    // @ts-ignore
    table.push(['Tests', stats.testsTotal - stats.testsFail, stats.testsFail, stats.testsTotal]);
    // @ts-ignore
    table.push([{ colSpan: 4, content: 'Total time taken: ' + (stats.endTime - stats.startTime) + 'ms' }]);

    var passPercentage = ((stats.testsTotal - stats.testsFail) / stats.testsTotal * 100);
    // @ts-ignore
    table.push([{ colSpan: 4, content: 'Tests pass percentage: ' + (passPercentage === 100 ? colors.green(passPercentage.toFixed(2)) : colors.red(passPercentage.toFixed(2))) + '%' }]);

    console.log(table.toString());
    // console.log(JSON.stringify(runResult.stats));
    // console.log(runResult.result);
}

module.exports = {
    init
};
