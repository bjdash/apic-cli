// @ts-check
const { NodeVM } = require('vm2');
const fs = require('fs');
const path = require('path');
//TODO: Better  handling of the path manipulation
const apicScripts = fs.readFileSync(path.join(__dirname, '/apic-lib.js')).toString()
.replace('module.exports = apic;', '')
.replace('ajv', path.normalize(path.join(__dirname, '../node_modules/ajv')).split('\\').join('\\\\'))
.replace('\'chai\'', '\''+path.normalize(path.join(__dirname, '../node_modules/chai')).split('\\').join('\\\\')+'\'');
;

function runScript (req, type) {
    const code = type === 'prescript' ? req.prescript : req.postscript;
    const sandbox = {
        reqObj: req,
        $response: req.response,
        $request: req.request,
        TESTS: {},
        TESTSX: []
    };
    const vm = new NodeVM({
        require: {
            external: true
        },
        sandbox
    });
    try {
        vm.run(apicScripts + code, type + '.js');
    } catch (e) {
        sandbox.reqObj.scriptError = e.stack;
    }
    sandbox.reqObj.TESTS = sandbox.TESTSX.concat(convertToTestX(sandbox.TESTS));
    return sandbox.reqObj;
}

function convertToTestX(tests) {
    var testsX = [];
    for (var name in tests) {
        var test = {
            name:name,
            success: tests[name],
            type:'old'
        }
        if(test.success === false){
            test.reason = 'You have used the deprecated test method which doesn\'t report error for each test case. Use apic.test() instead.'
        }
        testsX.push(test)
    }
    return testsX;
}

module.exports = {
    runScript
};
