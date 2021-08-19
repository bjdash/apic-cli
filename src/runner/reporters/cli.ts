import { RunEvents } from "../RunEvents";
import { Utils } from "../../utils";
import ora = require('ora');
import { bgGreen, bgRed, blue, green, red, reset, underline, white } from "colors/safe";
import { RunResult } from "../../models/RunResult.model";
import { CompiledApiRequest } from "../../models/CompiledRequest.model";
import { Suite } from "../../models/Suite.model";
import { SuiteRunStat } from "../../models/SuiteRunStat.model";
import Table = require('cli-table3');

export default class CliReporter {
    configs = {
        shouldLogResponseData: false
    }
    spinner;
    constructor(eventEmitter, options) {
        options.responseData && (this.configs.shouldLogResponseData = true);
        eventEmitter.on(RunEvents.TEST_START, this.onTestStart.bind(this));
        eventEmitter.on(RunEvents.REQ_RUN_START, this.onRequestRunStart.bind(this));
        eventEmitter.on(RunEvents.REQ_RUN_END, this.onRequestRunEnd.bind(this));
        eventEmitter.on(RunEvents.TEST_FINISHED, this.onTestFinished.bind(this));
    }

    onTestStart(suit) {
        console.log('Running suit: ', blue(suit.name));
    }

    onRequestRunStart(req: CompiledApiRequest) {
        this.spinner = ora(req.name).start();
    }

    onRequestRunEnd(runResult: RunResult) {
        (runResult.$response.status === 0 || runResult.$response.scriptError) ? this.spinner.fail() : this.spinner.succeed();
        var testStat = {
            passed: 0,
            failed: 0
        };

        // console.log('\n');
        var time = runResult.$response.timeTaken >= 1000 ? ((runResult.$response.timeTaken / 1000) + ' s') : (runResult.$response.timeTaken + ' ms');
        var statusStr = runResult.$response.statusText + ' (' + runResult.$response.status + ')';
        statusStr = runResult.$response.status.toString().charAt(0) === '2' ? green(statusStr) : red(statusStr).toString();

        // term.bold('\n► ' + api.request.name).right(25)('[ ' + statusStr + '  ' + time + ' ]\n');
        console.log('  ' + runResult.$request.method + '  ' + runResult.$request.url + '    [ ' + statusStr + '  ' + time + ' ]');

        if (runResult.$response.tests) {
            // console.log(`\n  ${underline('Tests:')}`);
            console.log(` `);

            runResult.$response.tests.forEach(function (test) {
                var testStr = '';
                if (test.success) {
                    testStat.passed++;
                    testStr = bgGreen('   PASSED   ');
                    console.log('  ' + testStr + '  ' + test.name);
                } else {
                    testStat.failed++;
                    testStr = bgRed('   FAILED   ');
                    console.log('  ' + testStr + '  ' + test.name);
                    console.log('                ' + red(test.reason))
                }
            })
        }

        if (runResult.$response.scriptError) {
            console.log(`\n  ${white(bgRed('Script error:'))}`)
            console.log(`  ${red(runResult.$response.scriptError)}`)
        }

        if (this.configs.shouldLogResponseData) {
            console.log('\n  ' + underline('Response:'))
            console.log('  ' + Utils.toString(runResult.$response.data || runResult.$response.body))
        }

        if (runResult.$response.logs) {
            console.log(`\n  ${underline('Run logs:')}`)
            runResult.$response.logs.forEach(log => {
                console.log('  █ ' + log.replace(/\n/g, '\n  '))
            })
        }

        console.log('\n');
    }

    onTestFinished(suiteRunResult: { result: RunResult[], suit: Suite, stats: SuiteRunStat }) {
        console.log('Finished running suit');

        const stats = suiteRunResult.stats;
        var table = new Table({
            head: ['', green('Success'), red('Failed'), reset('Total')],
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
        table.push([{ colSpan: 4, content: 'Tests pass percentage: ' + (passPercentage === 100 ? green(passPercentage.toFixed(2)) : red(passPercentage.toFixed(2))) + '%' }]);

        console.log(table.toString());
    }
}


