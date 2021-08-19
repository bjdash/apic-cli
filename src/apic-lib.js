/* eslint-disable */
const Ajv = require('ajv');
const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;

chai.Assertion.addProperty('date', function () {
    this.assert(
        new Date(this._obj).getTime() > 0
        , 'expected #{this} to be a valid Date'
        , 'expected #{this} to not be a valid Date'
    );
})

chai.Assertion.addMethod('matchSchema', function (statusCode) {
    var status = statusCode || this._obj.status || 'current';
    this.assert(
        validateSchema(statusCode)
        , 'expected response to match schema for status code: ' + status
        , 'expected response not to match schema for status code: ' + status
    );
});

var apic = {};
apic.randomStr = randomStr;
apic.randomNum = randomNum;
apic.randomEmail = randomEmail;
apic.randomInList = randomInList;
apic.time = time;
apic.s4 = s4;
apic.s8 = s8;
apic.s12 = s12;
apic.uuid = uuid;
apic.dataId = dataId;
apic.removeDemoItems = removeDemoItems;
apic.test = test;
apic.try = _try;
apic.basicAuth = basicAuth;


function randomStr(minLen, maxLen) {
    if (minLen < 1) {
        return '';
    }

    if (maxLen !== undefined) {
        minLen = randomNum(minLen, maxLen);
    }
    return new Array(minLen).join().replace(/(.|$)/g, function () {
        return ((Math.random() * 36) | 0).toString(36)[Math.random() < .5 ? 'toString' : 'toUpperCase']();
    });
}

function randomNum(min, max, isFloat) {
    min = min === undefined || typeof min !== 'number' ? 0 : min;
    max = max === undefined || typeof min !== 'number' ? 0 : max;

    if (isFloat) {
        return Math.random() * (max - min) + min;
    } else {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

function randomEmail() {
    return randomStr(5) + '.' + randomStr(4) + '@' + randomStr(4) + '.' + randomStr(3);
}

function randomInList(list) {
    if (!list || !list.length > 0) {
        return undefined;
    }
    var index = randomNum(0, list.length - 1);
    return list[index];
}

function time() {
    return new Date().getTime();
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function s8() {
    return s4() + s4();
}

function s12() {
    return s4() + s4() + s4();
}

function uuid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
function dataId() {
    var prefix = '',
        possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        index = 0;

    for (index = 0; index < 3; index++) {
        prefix += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return prefix + s4() + s4();
}
function removeDemoItems(items) {
    var itemsToReturn = [];
    if (items instanceof Array) {
        for (var i = 0; i < items.length; i++) {
            if (items[i]._id.indexOf('-demo') < 0) {
                itemsToReturn.push(items[i]);
            }
        }
    } else if (items._id.indexOf('-demo') < 0) {
        itemsToReturn.push(items);
    }
    return itemsToReturn;
}

function test(name, testFn) {
    try {
        testFn();
        TEST_RUN_CONTEXT.tests.push({
            name: name,
            success: true
        });
    } catch (e) {
        TEST_RUN_CONTEXT.tests.push({
            name: name,
            success: false,
            reason: e.message
        });
    }
}

function _try(testFn) {
    try {
        testFn();
    } catch (e) {
        log(`Error: ${e.message}`)
    }
}

function basicAuth(userName, password) {
    return "Basic " + btoa(userName + ":" + password);
}

function log() {
    let args = [...arguments], argsString = []

    for (let i = 0; i < args.length; i++) {
        try {
            argsString.push(JSON.stringify(args[i]));
        } catch (e) {
            argsString.push(`'Error parsing data. Could not convert to string: ${e.message}`);
        }
    }
    TEST_RUN_CONTEXT.logs.push(argsString.join(', '))
}

function validateSchema(code) {
    // @ts-ignore
    if (!Ajv) return false;

    if (code === undefined) {
        code = $response.status || undefined;
    }
    var valid = false;
    if (code !== undefined && $request.respCodes) {
        let codeStr = `${code}`;
        //code = code.toString();
        var schema = $request.respCodes.find(resp => resp.code == codeStr);

        if (!schema) return false;
        // @ts-ignore
        var a = new Ajv();
        valid = a.validate(schema.data, $response.data);
        //var validate = a.compile(schema);
        //valid = validate(reqObj.response.data);
    }
    return valid;
}

//Library functions
function setEnv(key, value) {
    if (!key)
        return false;
    if (!TEST_RUN_CONTEXT.envs.inMem)
        TEST_RUN_CONTEXT.envs.inMem = {};

    TEST_RUN_CONTEXT.envs.inMem = { ...TEST_RUN_CONTEXT.envs.inMem, [key]: value };
    return true;
}

function removeEnv(key) {
    if (key) {
        let { [key]: omit, ...rest } = TEST_RUN_CONTEXT.envs.inMem;
        TEST_RUN_CONTEXT.envs.inMem = rest;
    }
}
function getEnv(key) {
    return TEST_RUN_CONTEXT.envs.inMem?.[key] || TEST_RUN_CONTEXT.envs.saved?.[key]
}

module.exports = apic;
