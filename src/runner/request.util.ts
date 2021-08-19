import { CompiledApiRequest } from "../models/CompiledRequest.model";
import { ApiRequest } from "../models/Request.model";
import { METHOD_WITH_BODY } from "../constants";
import { Utils } from "../utils";
import apic = require('../apic-lib')

declare let jsf: any
export class RequestUtils {
    static checkForHTTP(url: string) {
        if (url.toLowerCase().indexOf('http') !== 0) {
            url = 'http://' + url;
        }
        return url;
    }

    /**
    * Prepares request for run, variables will not be interpolated yet
    */
    static getCompiledRequest(req: ApiRequest): CompiledApiRequest {
        const { _id, url, method, prescript, postscript, respCodes, name } = req;
        let newReq: CompiledApiRequest = { _id, url, method, prescript, postscript, respCodes, name };

        //interpolate query params
        let queryParams = req.Req.url_params
            ?.filter(qp => qp.key && (!qp.hasOwnProperty('active') || qp.active))
            ?.map(qp => {
                return {
                    key: qp.key,
                    val: qp.val,
                    active: true
                }
            })
        newReq.queryParams = Utils.keyValPairAsObject(queryParams)

        //interpolating header key and values
        let headersList = req.Req.headers
            ?.filter(h => h.key && (!h.hasOwnProperty('active') || h.active))
            ?.map(h => {
                return {
                    key: h.key.toLowerCase(),
                    val: h.val,
                    active: true
                }
            });
        newReq.headers = {
            ...Utils.keyValPairAsObject(headersList),
            'X-APIC-REQ-ID': Utils.s8() + '-' + Utils.s8()
        }

        //Prepare body to be sent with the request
        if (METHOD_WITH_BODY.indexOf(req.method) >= 0 && req.Body) {
            newReq.bodyType = req.Body.type;
            switch (req.Body.type) {
                case 'x-www-form-urlencoded':
                    //parsing x-www-form-urlencoded form data (key and values)
                    if (req.Body?.xForms) {
                        let xForms = req.Body.xForms.filter(xf => xf.key && xf.active)
                            .map(xf => {
                                return {
                                    active: xf.active,
                                    key: xf.key,
                                    val: xf.val
                                }
                            });
                        newReq.body = Utils.keyValPairAsObject(xForms);
                    } else {
                        newReq.body = {}
                    }
                    newReq.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    break;
                case 'raw':
                    // parsing raw body data
                    let rawBody = req.Body.rawData;
                    newReq.headers['Content-Type'] = req.Body.selectedRaw.val;
                    if (rawBody && req.Body.selectedRaw?.val?.includes('json')) {
                        try {
                            newReq.body = JSON.parse(rawBody);
                        } catch (e) {
                            console.error(`Unable to convert request body to json`, e);
                            newReq.body = rawBody;
                        }
                    } else {
                        newReq.body = rawBody;
                    }
                    break;
                case 'graphql':
                    req.Body.type = 'raw';
                    newReq.headers['Content-Type'] = 'application/json';
                    newReq.body = {
                        query: req.Body.rawData
                    };
                    if (req.Body.gqlVars) {
                        try {
                            let variables = JSON.parse(req.Body.gqlVars.trim());
                            if (variables) {
                                newReq.body.variables = variables;
                            }
                        } catch (e) {
                            console.error('Invalid graphql variables', e);
                        }
                    }
                    break;
                case 'form-data':
                    //parsing form data (key and values)
                    let formData = req.Body.formData.filter(xf => xf.key && xf.active)
                        .map(xf => {
                            return {
                                active: xf.active,
                                key: xf.key,
                                val: xf.val,
                                type: xf.type,
                                meta: xf.meta,
                            }
                        })
                    newReq.body = Utils.keyValPairAsObject(formData);
                    break;
            }
        }

        return newReq;
    }

    static getAxiosReq($request: CompiledApiRequest) {
        const axiosReq: any = {
            url: $request.url,
            method: $request.method,
            headers: $request.headers,
            transformResponse: (res) => {
                return res; // dont let axios convert data to JSON by default
            }
        };
        axiosReq.headers['X-APIC-REQ-ID'] = apic.s8() + '-' + apic.s8();

        if ('GET'.toLowerCase() !== $request.method) {
            switch ($request.bodyType) {
                case 'x-www-form-urlencoded':
                    axiosReq.data = Utils.getUrlEncodedXForm($request.body);
                    if (axiosReq.data) {
                        axiosReq.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    }
                    break;
                case 'raw':
                    axiosReq.data = $request.body;
                    if (axiosReq.data) {
                        axiosReq.headers['Content-Type'] = $request.headers['Content-Type'];
                    }
                    break;
                case 'form-data':
                    axiosReq.data = Utils.getFormDataBody($request.body)
                    axiosReq.headers['Content-Type'] = `multipart/form-data; boundary=${axiosReq.data._boundary}`;
                    break;
            }
        }
        if (axiosReq.data === undefined || axiosReq.data === null) {
            delete axiosReq.data;
        }
        return axiosReq;
    }
}