// @ts-check
const fs = require('fs');
const logger = require('./logger');
const utils = require('./utils');

function getSuitContent(suitPath) {
    logger.info('Using suit', suitPath);
    const suitStr = fs.readFileSync(suitPath);
    const suit = JSON.parse(suitStr.toString());
    if (!suit || typeof suit !== 'object' || suit.TYPE !== 'APICSuit') {
        logger.error('Provided path doesn\'t contain a valid APIC suit/project');
        throw new Error('Invalid test suit or project');
    }
    return suit;
}

function getEnvironments(envPath) {
    logger.info('Using environment variables from', envPath || '<N/A>');
    const envStr = fs.readFileSync(envPath);
    const envObj = JSON.parse(envStr.toString());
    if (!envObj || typeof envObj !== 'object' || envObj.TYPE !== 'Environment' || !envObj.value.vals) {
        logger.error('Provided path doesn\'t contain valid APIC environment variables');
        throw new Error('Invalid environment variables');
    }
    const envVars = {};
    envObj.value.vals.forEach(pair => {
        envVars[pair.key] = pair.val;
    });
    return envVars;
}

function validateRun(suitPath) {
    if (!suitPath) {
        logger.error('You havent specified a suit or a project to run');
        throw new Error('You havent specified a suit or a project to run');
    }
    if (typeof suitPath !== 'string') {
        logger.error('The path to your test suit/project should be a string');
        throw new Error('The path to your test suit/project should be a string');
    }
}

function formatRequest(req, env) {
    var reqObj = {
        request: {
            _id: req._id,
            name: req.name,
            url: req.url,
            method: req.method,
            headers: utils.arrayToObj(req.Req.headers),
            query: utils.arrayToObj(req.Req.url_params),
            bodyMeta: req.Body
        },
        env: {
            vals: env
        },
        prescript: req.prescript,
        postscript: req.postscript,
        respCodes: [],
        TESTS:[]
    };
    for (var i = 0; i < req.respCodes.length; i++) {
        if (req.respCodes[i].data) {
            var resp = {
                code: req.respCodes[i].code,
                data: req.respCodes[i].data
            };
            reqObj.respCodes.push(resp);
        }
    }
    if (req.method === 'GET') {
        reqObj.Body = null;
        reqObj.data = null;
    }
    return reqObj;
}

function interpolateRequest(req) {
    const scope = req.env.vals;
    // interpolate url
    req.request.url = utils.checkForHTTP(utils.interpolate(req.request.url, scope));

    // interpolating raw body data
    if (req.request.bodyMeta.rawData) {
        req.request.bodyMeta.rawData = utils.interpolate(req.request.bodyMeta.rawData, scope);
    }

    // interpolate query params
    Object.keys(req.request.query).forEach(function (key) {
        var ikey = utils.interpolate(key, scope);
        var ival = utils.interpolate(req.request.query[key], scope);
        delete req.request.query[key];
        req.request.query[ikey] = ival;
    });
    req.request.url = utils.prepareQueryParams(req.request.url, req.request.query);

    // interpolating header key and values
    Object.keys(req.request.headers).forEach(function (key) {
        var ikey = utils.interpolate(key, scope);
        var ival = utils.interpolate(req.request.headers[key], scope);
        delete req.request.headers[key];
        req.request.headers[ikey] = ival;
    });

    // interpolating x-www-form-urlencoded form data (key and values)
    if (req.request.bodyMeta && req.request.bodyMeta.xForms) {
        for (var i = 0; i < req.request.bodyMeta.xForms.length; i++) {
            if (req.request.bodyMeta.xForms[i].key) {
                req.request.bodyMeta.xForms[i].key = utils.interpolate(req.request.bodyMeta.xForms[i].key, scope);
                req.request.bodyMeta.xForms[i].val = utils.interpolate(req.request.bodyMeta.xForms[i].val, scope);
            }
        }
    }

    if (req.request.bodyMeta && req.request.bodyMeta.formData) {
        for (var j = 0; j < req.request.bodyMeta.formData.length; j++) {
            if (req.request.bodyMeta.formData[j].key) {
                req.request.bodyMeta.formData[j].key = utils.interpolate(req.request.bodyMeta.formData[j].key, scope);
                if (req.request.bodyMeta.formData[j].type === 'Text') {
                    req.request.bodyMeta.formData[j].val = utils.interpolate(req.request.bodyMeta.formData[j].val, scope);
                }
            }
        }
    }

    // TODO: do we need ? delete req.env.vals.apic;

    return req;
}

function setRequestBody(req) {
    if (req.request.method !== 'GET' && req.request.bodyMeta) {
        switch (req.request.bodyMeta.type) {
            case 'form-data':
                if(req.request.bodyMeta.formData && req.request.bodyMeta.formData.length>0){
                    req.request.body = {};
                    req.request.bodyMeta.formData.forEach(function(kv){
                        if(kv.key){
                            req.request.body[kv.key] = kv.val;
                        }
                    });
                }
                break
            case 'x-www-form-urlencoded':
                if(req.request.bodyMeta.xForms && req.request.bodyMeta.xForms.length>0){
                    req.request.body = {};
                    req.request.bodyMeta.xForms.forEach(function(kv){
                        if(kv.key){
                            req.request.body[kv.key] = kv.val;
                        }
                    });
                }
                break
            case 'raw':
            case 'graphql':
            default:
                try{
                    req.request.body = JSON.parse(req.request.bodyMeta.rawData);
                }catch(e){
                    req.request.body = req.request.bodyMeta.rawData;
                }
        }
    }
}

function buildResponse(res, sentTime) {
    var respTime = Date.now();

    var respObj = {
        // headersStr: headerStr, TODO: may be add this ?
        headers: res.headers,
        status: res.status,
        statusText: res.statusText,
        // readyState: target.readyState, TODO: may be add this too?
        body: res.data,
        timeTaken: respTime - sentTime
    };
    // try to convert response to json object
    var jsonResp;
    try {
        jsonResp = JSON.parse(respObj.body);
    } catch (e) { }
    if (jsonResp) {
        respObj.data = jsonResp;
    }
    return respObj;
}

function buildResponseError(error) {
    return {
        status: 0,
        statusText: error.messahe || 'Unknown',
        body: error.message,
        timeTaken: 0
    };
}

module.exports = {
    getSuitContent,
    getEnvironments,
    validateRun,
    formatRequest,
    interpolateRequest,
    setRequestBody,
    buildResponse,
    buildResponseError
};
