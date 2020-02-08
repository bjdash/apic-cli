// @ts-check
const Constants = require('../constants');
var xmlBuilder = require('xmlbuilder');
const utils = require('../utils');
var fs = require('fs');
var path = require('path');

const configs = {
    reportLocation: path.join(process.cwd(), 'apic-reports'),
    filePath: ''
}
var file;
function init(eventEmitter, options) {
    if (options && options.reportersJunitPath) {
        configs.reportLocation = path.normalize(options.reportersJunitPath);
    }
    try {
        if (!fs.existsSync(configs.reportLocation)) {
            fs.mkdirSync(configs.reportLocation);
        }
        eventEmitter.on(Constants.events.TEST_START, onTestStart);
        eventEmitter.on(Constants.events.REQ_RUN_START, onRequestRunStart);
        eventEmitter.on(Constants.events.REQ_RUN_END, onRequestRunEnd);
        eventEmitter.on(Constants.events.TEST_FINISHED, onTestFinished);
    } catch (e) {
        console.error('Error while initiating junit report', e)
    }
}

function onTestStart(suit) {
    try {
        configs.filePath = path.join(configs.reportLocation, getReportName(suit.name));
        file = fs.openSync(configs.filePath, 'w');
    } catch (e) {
        console.error('Error while writing junit report', e);
    }
}

function onRequestRunStart(req) { }

function onRequestRunEnd(api) { }

function onTestFinished(runResult) {
    var { suit, stats, result } = runResult;
    var root = xmlBuilder.create('testsuites')
        .att('name', suit.name)
        .att('tests', result.length)
        .att('time', (stats.endTime - stats.startTime) / 1000)
        .att('failures', stats.testsFail);

    result.forEach(api => {
        var suiteEle = root.ele('testsuite', {
            name: api.request.name,
            id: api.request._id,
            tests: api.TESTS.length, //[] for no tests,
            time: api.response.timeTaken/1000
        })
        api.TESTS.forEach(test=>{
            var testCaseObj = {
                testcase:{
                    '@name':test.name,
                    '@time':api.response.timeTaken/1000
                }
            }
            if(!test.success){
                testCaseObj.testcase.failure = {
                    '@type':'Assertion',
                    '@message':test.reason,
                    '#cdata':[
						'REASON: '+test.reason,
						'RESPONSE: '+api.response.body						
					]
                }
            }
            suiteEle.ele(testCaseObj);
        })
    })

    var xml = root.end({ pretty: true })
    fs.writeSync(file, xml);
    fs.closeSync(file);
}

function getReportName(suitName) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var date = new Date();
    return utils.sanitizeFileName(suitName + '-apic-' + date.getDate() + '-' + months[date.getMonth()] + '-' + date.getFullYear() + '-' + date.getTime() + '.xml');
}

module.exports = {
    init
};
