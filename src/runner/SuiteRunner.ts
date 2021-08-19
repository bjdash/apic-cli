import { DefaultRunOptions } from "../constants";
import { InterpolationService } from "./InterpolationService";
import { ExportedSuite } from "../models/ExportedSuite.model";
import { ApiRequest } from "../models/Request.model";
import { RunEvents } from "./RunEvents";
import { RunOption } from "../models/RunOption.model";
import { RunResult } from "../models/RunResult.model";
import { Suite } from "../models/Suite.model";
import { SuiteRunStat } from "../models/SuiteRunStat.model";
import { ReporterInitiator } from "./ReporterInitiator";
import { RequestRunner } from "./RequestRunner";
import { TestRunner } from "./TestRunner";
import { Utils } from "../utils";

export class Runner {
    reqRunner: RequestRunner;
    runOptions: RunOption;
    suitePath: string;
    suite: Suite;
    scope: { [key: string]: string } = {};
    reporter: ReporterInitiator;
    stats: SuiteRunStat;
    interpolator: InterpolationService;
    testRunner: TestRunner;
    results: RunResult[]

    constructor(suitePath: string, options: RunOption) {
        this.suitePath = suitePath;
        if (!options) {
            options = {}
        }
        this.runOptions = { ...DefaultRunOptions, ...options };
        this.reporter = new ReporterInitiator(this.runOptions);
        this.results = [];
    }

    async initializeAndValidate() {
        Utils.validateRun(this.suitePath);
        let suiteData: ExportedSuite = await Utils.getSuitContent(this.suitePath);
        this.suite = suiteData.value;
        if (this.runOptions.environment) {
            this.scope = Object.assign(Utils.getEnvironments(this.runOptions.environment), this.scope);
        } else if (this.suite.envVars) {
            this.scope = Object.assign(Utils.keyValPairAsObject(this.suite.envVars, true), this.scope);
        }
        this.interpolator = new InterpolationService(this.scope, {});
        this.testRunner = new TestRunner(this.interpolator);
        this.reqRunner = new RequestRunner(this.testRunner, this.interpolator, this.reporter);
    }

    async run() {
        this.reporter.emit(RunEvents.TEST_START, this.suite);
        this.stats = this.resetStat();
        for (var i = 0; i < this.suite.reqs.length; i++) {
            let request: ApiRequest = this.suite.reqs[i];
            let result: RunResult = await this.reqRunner.run(request);
            this.results.push(result);
        }
        this.finishRun();
    }

    finishRun() {
        this.populateStats();
        this.reporter.emit(RunEvents.TEST_FINISHED, {
            result: this.results,
            suit: this.suite,
            stats: this.stats
        });
        if (this.stats.endResult === 'FAIL') process.exit(1);
    }

    private resetStat(): SuiteRunStat {
        return {
            startTime: Date.now(),
            endTime: null,
            requestsTotal: 0,
            requestsFail: 0,
            testsTotal: 0,
            testsFail: 0,
            endResult: 'PASS'
        }
    }

    private populateStats() {
        this.stats.endTime = Date.now();
        this.stats.requestsTotal = this.results.length;
        this.results.forEach(result => {
            if (result.$response.status === 0) {
                this.stats.requestsFail++;
                this.stats.endResult = 'FAIL'
            }
            result.$response.tests && result.$response.tests.forEach(test => {
                this.stats.testsTotal++;
                if (!test.success) {
                    this.stats.testsFail++;
                    this.stats.endResult = 'FAIL';
                }
            });
            if (result.$response.scriptError) this.stats.endResult = 'FAIL';
        });
    };
}