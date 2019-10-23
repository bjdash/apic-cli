
const reckon = require('reckonjs');
const apicLib = require('./apic-lib');
const FormData = require('form-data');
const fs = require('fs');

function interpolate(text, scope) {
    const fullScope = Object.assign({}, { apic: apicLib }, scope);
    return reckon({ text: text, scope: fullScope }).toString();
}

function arrayToObj(array) {
    var obj = {};
    for (var i = 0; i < array.length; i++) {
        if (array[i].key) {
            obj[array[i].key] = array[i].val;
        }
    }
    return obj;
}

function checkForHTTP(url) {
    if (url.indexOf('http') !== 0) {
        url = 'http://' + url;
    }
    return url;
}

// add query string to URL, params can be in 2 format
// [{key:'k1', val:'v1' }, {....}]
// or
// {k1:v1}
function prepareQueryParams(url, params) {
    var queryString = [];
    if (params instanceof Array) { // if params is an array of key value pair
        params.forEach(function (param) {
            if (param.key) {
                queryString.push(encodeURIComponent(param.key) + '=' + encodeURIComponent(param.val));
            }
        });
    } else { // params is an object
        var keys = Object.keys(params);
        for (var i = 0; i < keys.length; i++) {
            queryString.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(params[keys[i]]));
        }
    }
    if (queryString.length > 0) {
        // check if URL already has querystrings
        if (url.indexOf('?') > 0) {
            return url + '&' + queryString.join('&');
        }
        return url + '?' + queryString.join('&');
    }
    return url;
}

function getAxiosRequest(req) {
    const axiosReq = {
        url: req.request.url,
        method: req.request.method,
        headers: req.request.headers,
        transformResponse: (res) => {
            return res; // dont let axios convert data to JSON by default
        }
    };
    axiosReq.headers['X-APIC-REQ-ID'] = apicLib.s8() + '-' + apicLib.s8();

    if ('GET'.toLowerCase() !== req.request.method) {
        switch (req.request.bodyMeta.type) {
            case 'x-www-form-urlencoded':
                axiosReq.data = getUrlEncodedBody(req.request.bodyMeta.xForms);
                if (axiosReq.data) {
                    axiosReq.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                break;
            case 'raw':
                axiosReq.data = req.request.bodyMeta.rawData;
                if (axiosReq.data) {
                    axiosReq.headers['Content-Type'] = req.request.bodyMeta.selectedRaw.val;
                }
                break;
            case 'form-data':
                axiosReq.data = getFormDataBody(req.request.bodyMeta.formData)
                axiosReq.headers['Content-Type'] = `multipart/form-data; boundary=${axiosReq.data._boundary}`;
                break;
        }
    }
    if (axiosReq.data === undefined || axiosReq.data === null) {
        delete axiosReq.data;
    }
    return axiosReq;
}

function getUrlEncodedBody(xForms) {
    var paramsList = [];
    for (var i = 0; i < xForms.length; i++) {
        var pair = xForms[i];
        if (pair.key) {
            var key = encodeURIComponent(pair.key);
            key = key.replace(/%20/g, '+');
            var val = encodeURIComponent(pair.val);
            val = val.replace(/%20/g, '+');
            paramsList.push(key + '=' + val);
        }
    }
    if (paramsList.length > 0) {
        return paramsList.join('&');
    } else {
        return null;
    }
}

function getFormDataBody(formDataBody) {
    const formData = new FormData();
    if (formDataBody && formDataBody.length > 0) {
        formDataBody.forEach(function (data) {
            if (data.type === 'Text') {
                formData.append(data.key, data.val);
            } else {
                try{
                    var file = fs.createReadStream(data.val);
                    formData.append(data.key, file);
                }catch(e){
                    console.log(`\n  Failed to read file for upload: ${e.message}`);
                }
            }
        })
    }
    return formData;
}

function toString(data) {
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

module.exports = {
    interpolate,
    arrayToObj,
    checkForHTTP,
    prepareQueryParams,
    getAxiosRequest,
    getUrlEncodedBody,
    getFormDataBody,
    toString
};
