import { readFileSync } from "fs";
import { join, normalize } from "path";
import { NodeVM } from "vm2";
import { InterpolationService } from "./InterpolationService";
import { TestResponse } from "../models/TestResponse.model";
import { TestScript } from "../models/TestScript.model";

export class TestRunner {
    apicScripts: string;
    constructor(private interpolator: InterpolationService) {
        this.apicScripts = readFileSync(join(__dirname, '../apic-lib.js')).toString()
            .replace('module.exports = apic;', '')
            .replace('ajv', normalize(join(__dirname, '../../node_modules/ajv')).split('\\').join('\\\\'))
            .replace('\'chai\'', '\'' + normalize(join(__dirname, '../../node_modules/chai')).split('\\').join('\\\\') + '\'');
        ;
    }

    runScript(script: TestScript): TestResponse {
        const code = script.script;
        const sandbox = {
            // reqObj: req,
            $response: script.$response,
            $request: script.$request,
            $env: script.envs,
            $scriptType: script.type,
            TEST_RUN_CONTEXT: {
                envs: script.envs,
                logs: [],
                tests: [],
                scriptError: null,
            }
        };
        const vm = new NodeVM({
            require: {
                external: true
            },
            sandbox
        });
        try {
            vm.run(this.apicScripts + code, script.type + '.js');

        } catch (e) {
            sandbox.TEST_RUN_CONTEXT.scriptError = e.stack;
        }
        // console.log(sandbox);
        // sandbox.reqObj.TESTS = sandbox.TESTSX.concat(convertToTestX(sandbox.TESTS));
        // return sandbox.reqObj;
        this.interpolator.inMem = sandbox.TEST_RUN_CONTEXT.envs.inMem;
        return {
            type: script.type,
            inMem: sandbox.TEST_RUN_CONTEXT.envs.inMem,
            logs: sandbox.TEST_RUN_CONTEXT.logs,
            tests: sandbox.TEST_RUN_CONTEXT.tests,
            scriptError: sandbox.TEST_RUN_CONTEXT.scriptError
        }
        // return new Promise(resolve => {
        //     resolve(null)
        // })
    }
}