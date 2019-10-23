// @ts-check
const Constants = require('./constants');
const events = require('events');
var colors = require('colors/safe');

function ReporterInitiator (reportersString, options) {
    if (!reportersString) reportersString = '';
    var reporterNames = [];
    if (reportersString) {
        reporterNames = reportersString.split(',');
    }
    // add default reporters if not specified
    Constants.reporters.default.forEach(reporter => {
        if (reporterNames.indexOf(reporter) < 0) reporterNames.push(reporter);
    });

    // load reporter path for built-in reporters
    const reportersToLoad = reporterNames.map(name => {
        return Constants.reporters.available.indexOf(name) >= 0 ? (Constants.reporters.path + name) : name;
    });
    this.eventEmitter = new events.EventEmitter();
    this.reporters = [];
    reportersToLoad.forEach(reporterPath => {
        try{
            this.reporters.push(require(reporterPath).init(this.eventEmitter, options));
        }catch(e){
            if(e.message.indexOf('Cannot find module')>=0){
                console.log(colors.bgRed('ERROR:') + colors.red(` ${reporterPath} is not a valid reporter`));
            }else{
                console.error(e)
            }
        }
    });
}

ReporterInitiator.prototype.emit = function (eventName, data) {
    this.eventEmitter.emit(eventName, data);
};

ReporterInitiator.prototype.getReporters = function () {
    return this.reporters;
};

module.exports = ReporterInitiator;
