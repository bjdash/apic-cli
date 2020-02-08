// @ts-check
const axios = require('axios');
const utils = require('./utils');
const scriptRunner = require('./scriptRunner');
const ReporterInitiator = require('./reporterInitiator');
const Constants = require('./constants');
const runHelper = require('./runHelper');

function Runner(suitPath, options) {
    runHelper.validateRun(suitPath);

    this.reporter = new ReporterInitiator(options.reporters, options);
    this.suit = runHelper.getSuitContent(suitPath);
    this.scope = {};
    if (options.environment) {
        this.scope = Object.assign(runHelper.getEnvironments(options.environment), this.scope);
    }else if(this.suit.value.envVars){
        this.scope = Object.assign(utils.arrayToObj(this.suit.value.envVars), this.scope);
    }
    this.requests = this.suit.value.reqs;
    this.resusts = [];
}

Runner.prototype.run = async function () {
    this.reporter.emit(Constants.events.TEST_START, this.suit.value);
    this.stats = {
        startTime: Date.now(),
        requestsTotal: 0,
        requestsFail: 0,
        testsTotal: 0,
        testsFail: 0,
        endResult: 'PASS'
    };
    for (var i = 0; i < this.requests.length; i++) {
        const result = await this.runRequest(this.requests[i], this.scope);
        this.resusts.push(result);
    }
    this.finishRun();
};

Runner.prototype.runRequest = async function (req, scope) {
    return new Promise(resolve => {
        this.reporter.emit(Constants.events.REQ_RUN_START, req);

        var request = runHelper.formatRequest(req, scope);

        try {
            // run pre script if any
            if (request.prescript && request.prescript.trim()) {
                request = scriptRunner.runScript(request, 'prescript');
            }
            if (request.xtraEnv) {
                request.env.vals = Object.assign(request.env.vals, request.xtraEnv);
            }
            request = runHelper.interpolateRequest(request);
            runHelper.setRequestBody(request);
            const axiosReq = utils.getAxiosRequest(request);

            const sentTime = Date.now();
            // @ts-ignore
            axios(axiosReq).then(res => {
                request.response = runHelper.buildResponse(res, sentTime);
                request = scriptRunner.runScript(request, 'postscript');
                this.finishRunRequest(request);
                resolve(request);
            }).catch(e => {
                if (e.response) {
                    request.response = runHelper.buildResponse(e.response, sentTime);
                    request = scriptRunner.runScript(request, 'postscript');
                } else {
                    request.response = runHelper.buildResponseError(e);
                }
                this.finishRunRequest(request);
                resolve(request);
            });
        } catch (e) {
            console.log(e);
            request.response = runHelper.buildResponseError(e);
            this.finishRunRequest(request);
            resolve(request);
        }
    });
};

Runner.prototype.finishRunRequest = function (request) {
    if(!request.TESTS)request.TESTS = [];
    this.scope = Object.assign(this.scope, request.xtraEnv);
    this.reporter.emit(Constants.events.REQ_RUN_END, request);
};

Runner.prototype.finishRun = function () {
    this.getStats();
    this.reporter.emit(Constants.events.TEST_FINISHED, {
        result: this.resusts,
        suit: this.suit.value,
        stats: this.stats
    });
    //TODO: exit on fail
    if(this.stats.endResult === 'FAIL') process.exit(1);
};

Runner.prototype.getStats = function () {
    this.stats.endTime = Date.now();
    this.stats.requestsTotal = this.resusts.length;
    this.resusts.forEach(result => {
        if (result.response.status === 0) {
            this.stats.requestsFail++;
            this.stats.endResult = 'FAIL'
        }
        result.TESTS && result.TESTS.forEach(test => {
            this.stats.testsTotal++;
            if (!test.success) {
                this.stats.testsFail++;
                this.stats.endResult = 'FAIL';
            }
        });
        if (result.scriptError) this.stats.endResult = 'FAIL';
    });
};

module.exports = Runner;
