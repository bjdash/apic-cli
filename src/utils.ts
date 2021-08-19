import { Logger } from "./runner/logger";
import { readFileSync } from 'fs';
import * as https from 'https'
import { ExportedSuite } from "./models/ExportedSuite.model";
import { KeyVal } from "./models/KeyVal.model";

// const fs = require('fs');
// const https = require('https');

export class Utils {
    static validateRun(suitPath) {
        if (!suitPath) {
            Logger.error('You havent specified a suit or a project to run');
            throw new Error('You havent specified a suit or a project to run');
        }
        if (typeof suitPath !== 'string') {
            Logger.error('The path to your test suit/project should be a string');
            throw new Error('The path to your test suit/project should be a string');
        }
    }

    static getSuitContent(suitePath): Promise<ExportedSuite> {
        return new Promise((resolve) => {
            Logger.info('Using suit', suitePath);
            let suitStr, suit;
            if (suitePath.indexOf('https://') === 0 || suitePath.indexOf('http://') === 0) {
                Logger.info(`Loading suite content from ${suitePath}`);
                https.get(suitePath, (resp) => {
                    let data = '';
                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });
                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        var suiteResp = JSON.parse(data);
                        if (!suiteResp || !suiteResp.TYPE) {
                            throw new Error('Failed to load test suit or project')
                        }
                        resolve(suiteResp);
                    });
                }).on("error", (err) => {
                    throw new Error('Failed to load test suit or project');
                });
            } else {
                suitStr = readFileSync(suitePath);
                suit = JSON.parse(suitStr.toString());
                if (!suit || typeof suit !== 'object' || suit.TYPE !== 'APICSuite') {
                    Logger.error('Provided path doesn\'t contain a valid APIC suit/project');
                    throw new Error('Invalid test suit or project');
                }
                resolve(suit);
            }

        })
    }

    static getEnvironments(envPath): { [key: string]: string } {
        Logger.info('Using environment variables from', envPath || '<N/A>');
        const envStr = readFileSync(envPath);
        const envObj = JSON.parse(envStr.toString());
        if (!envObj || typeof envObj !== 'object' || envObj.TYPE !== 'Environment' || !envObj.value.vals) {
            Logger.error('Provided path doesn\'t contain valid APIC environment variables');
            throw new Error('Invalid environment variables');
        }
        const envVars = {};
        envObj.value.vals.forEach(pair => {
            envVars[pair.key] = pair.val;
        });
        return envVars;
    }

    static toString(data) {
        if (typeof data === 'string') {
            return data
        } else {
            try {
                return JSON.stringify(data);
            } catch (e) {
                return e.message;
            }
        }
    }

    static sanitizeFileName(input, replacement = '') {
        var illegalRe = /[\/\?<>\\:\*\|"]/g;
        var controlRe = /[\x00-\x1f\x80-\x9f]/g;
        var reservedRe = /^\.+$/;
        var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
        var windowsTrailingRe = /[\. ]+$/;

        return input
            .replace(illegalRe, replacement)
            .replace(controlRe, replacement)
            .replace(reservedRe, replacement)
            .replace(windowsReservedRe, replacement)
            .replace(windowsTrailingRe, replacement);
    }

    static getUrlEncodedXForm(xForm: { [key: string]: string }) {
        var paramsList = Utils.objectEntries(xForm).map(([key, val]) => {
            if (key) {
                key = encodeURIComponent(key).replace(/%20/g, '+');
                val = encodeURIComponent(val).replace(/%20/g, '+');
                return (key + '=' + val);
            }
            return;
        }).filter(p => p != undefined);

        return paramsList.length > 0 ? paramsList.join('&') : null;
    }

    static objectEntries<T>(obj: { [key: string]: T }): [string, T | any][] {
        return obj ? (Object.entries(obj)) : [];
    }

    static getFormDataBody(formData) {
        var bodyData = new FormData();
        for (var i = 0; i < formData.length; i++) {
            var obj = formData[i];
            if (obj.key) {
                if (obj.type.toLowerCase() === 'text') {
                    bodyData.append(obj.key, obj.val);
                } else if (obj.type.toLowerCase() === 'file') {
                    bodyData.append(obj.key, obj.meta);
                }
            }
        }
        return bodyData;
    }

    static keyValPairAsObject(keyVals: KeyVal[], includeInactive?: boolean) {
        if (!keyVals?.length) return {};
        return keyVals
            .filter(kv => includeInactive || kv.active)
            .reduce((obj, item: KeyVal) => Object.assign(obj, { [item.key]: item.val }), {});
    }

    static s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    static s8() {
        return Utils.s4() + Utils.s4();
    }

    static s12() {
        return Utils.s4() + Utils.s4() + Utils.s4();
    }

    static formatTime(timeDiff: number): string {
        return timeDiff >= 1000 ? (timeDiff / 1000) + ' s' : timeDiff + ' ms'
    }

    static prepareHeadersObj(headerStr) {
        var headerList = headerStr.split('\n'),
            headers = {};
        for (var i = 0; i < headerList.length; i++) {
            if (headerList[i].search(':') >= 0) {
                var index = headerList[i].indexOf(':');
                //var split = headerList[i].split(':');
                headers[headerList[i].substring(0, index).trim()] = headerList[i].substring(index + 1).trim();
            }
        }
        return headers;
    }
}