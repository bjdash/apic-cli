/* eslint-disable */
const Ajv = require('ajv');
const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;

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

function randomStr (minLen, maxLen) {
    if (minLen < 1) {
        return '';
    }

    if (maxLen !== undefined) {
        minLen = randomNum(minLen, maxLen);
    }
    return new Array(minLen).join().replace(/(.|$)/g, function () {
        return ((Math.random() * 36) | 0).toString(36)[Math.random() < 0.5 ? 'toString' : 'toUpperCase']();
    });
}

function randomNum (min, max, isFloat) {
    min = min === undefined || typeof min !== 'number' ? 0 : min;
    max = max === undefined || typeof min !== 'number' ? 0 : max;

    if (isFloat) {
        return Math.random() * (max - min) + min;
    } else {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

function randomEmail () {
    return randomStr(5) + '.' + randomStr(4) + '@' + randomStr(4) + '.' + randomStr(3);
}

function randomInList (list) {
    if (!list || !list.length > 0) {
        return undefined;
    }
    var index = randomNum(0, list.length - 1);
    return list[index];
}

function time () {
    return new Date().getTime();
}

function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function s8 () {
    return s4() + s4();
}

function s12 () {
    return s4() + s4() + s4();
}

function uuid () {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
function dataId () {
    var prefix = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var index = 0;

    for (index = 0; index < 3; index++) {
        prefix += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return prefix + s4() + s4();
}
function removeDemoItems (items) {
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

function log (data) {
    if (!data) { return; }
    var delim = '\n';
    if (!reqObj.logs) {
        reqObj.logs = '';
        delim = '';
    }
    try {
        reqObj.logs += delim + JSON.stringify(data);
    } catch (e) {
        reqObj.logs += delim + 'Error parsing data. COuld not convert to string';
    }
}

function setEnv (key, value) {
    if (!key) { return false; }
    if (!reqObj.xtraEnv) { reqObj.xtraEnv = {}; }
    // if(!reqObj.xtraEnv.vals) reqObj.xtraEnv.vals = {};

    reqObj.xtraEnv[key] = value;
    return true;
}

function removeEnv (key) {
    if (key && reqObj && reqObj.env && reqObj.env.vals) {
        delete reqObj.env.vals[key];
    }
}
function getEnv (key) {
    if (key && reqObj && reqObj.env && reqObj.env.vals) {
        return reqObj.env.vals[key];
    }
}

function assertTrue (msg, condition) {
    if (condition) {
        TESTS[msg] = true;
    } else {
        TESTS[msg] = false;
    }
}

function assertFalse (msg, condition) {
    if (!condition) {
        TESTS[msg] = true;
    } else {
        TESTS[msg] = false;
    }
}

function validateSchema (code) {
    if (code === undefined) {
        code = reqObj.response.status || undefined;
    }
    var valid = false;
    if (code !== undefined && reqObj.respCodes) {
        var schema;
        for (var i = 0; i < reqObj.respCodes.length; i++) {
            if (reqObj.respCodes[i].code == code) {
                schema = reqObj.respCodes[i].data;
                break;
            }
        }
        if (!schema) return false;
        var a = new Ajv();
        valid = a.validate(schema, reqObj.response.data);
    }
    return valid;
}

function test(name, testFn){
    try{
        testFn();
        TESTSX.push({
            name: name,
            success: true
        });
    }catch(e){
        TESTSX.push({
            name: name,
            success: false,
            reason: e.message
        });
    }
}

module.exports = apic;
