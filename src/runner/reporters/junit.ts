import { closeSync, existsSync, mkdirSync, openSync, writeSync } from "fs";
import { join, normalize } from "path";
import { create } from "xmlbuilder";
import { CompiledApiRequest } from "../../models/CompiledRequest.model";
import { RunEvents } from "../RunEvents";
import { RunResult } from "../../models/RunResult.model";
import { Suite } from "../../models/Suite.model";
import { SuiteRunStat } from "../../models/SuiteRunStat.model";
import { Utils } from "../../utils";



export default class JunitReporter {
    configs;
    file;

    constructor(eventEmitter, options) {
        this.configs = {
            reportLocation: join(process.cwd(), 'apic-reports'),
            filePath: ''
        }
        if (options && options.reportersJunitPath) {
            this.configs.reportLocation = normalize(options.reportersJunitPath);
        }
        try {
            if (!existsSync(this.configs.reportLocation)) {
                mkdirSync(this.configs.reportLocation);
            }
            eventEmitter.on(RunEvents.TEST_START, this.onTestStart.bind(this));
            eventEmitter.on(RunEvents.REQ_RUN_START, this.onRequestRunStart.bind(this));
            eventEmitter.on(RunEvents.REQ_RUN_END, this.onRequestRunEnd.bind(this));
            eventEmitter.on(RunEvents.TEST_FINISHED, this.onTestFinished.bind(this));
        } catch (e) {
            console.error('Error while initiating junit report', e)
        }
    }

    onTestStart(suit) {
        try {
            this.configs.filePath = join(this.configs.reportLocation, this.getReportName(suit.name));
            this.file = openSync(this.configs.filePath, 'w');
        } catch (e) {
            console.error('Error while writing junit report', e);
        }
    }

    onRequestRunStart(req: CompiledApiRequest) { }

    onRequestRunEnd(runResult: RunResult) { }

    onTestFinished(runResult: { result: RunResult[], suit: Suite, stats: SuiteRunStat }) {
        var { suit, stats, result } = runResult;
        var root = create('testsuites')
            .att('name', suit.name)
            .att('tests', result.length)
            .att('time', (stats.endTime - stats.startTime) / 1000)
            .att('failures', stats.testsFail);

        result.forEach(reqRunRes => {
            var suiteEle = root.ele('testsuite', {
                name: reqRunRes.$request.name,
                id: reqRunRes.$request._id,
                tests: reqRunRes.$response.tests.length, //[] for no tests,
                time: reqRunRes.$response.timeTaken / 1000
            })
            reqRunRes.$response.tests.forEach(test => {
                var testCaseObj: any = {
                    testcase: {
                        '@name': test.name,
                        '@time': reqRunRes.$response.timeTaken / 1000
                    }
                }
                if (!test.success) {
                    testCaseObj.testcase.failure = {
                        '@type': 'Assertion',
                        '@message': test.reason,
                        '#cdata': [
                            'REASON: ' + test.reason,
                            'RESPONSE: ' + reqRunRes.$response.body
                        ]
                    }
                }
                suiteEle.ele(testCaseObj);
            })
        })

        var xml = root.end({ pretty: true })
        writeSync(this.file, xml);
        closeSync(this.file);
    }

    getReportName(suitName) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var date = new Date();
        return Utils.sanitizeFileName(suitName + '-apic-' + date.getDate() + '-' + months[date.getMonth()] + '-' + date.getFullYear() + '-' + date.getTime() + '.xml');
    }
}

