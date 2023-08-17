import { METHOD_WITH_BODY } from "../constants";
import { InterpolationService } from "./InterpolationService";
import { CompiledApiRequest } from "../models/CompiledRequest.model";
import { ApiRequest } from "../models/Request.model";
import { RunResponse } from "../models/RunResponse.model";
import { RunResult } from "../models/RunResult.model";
import { TestResponse } from "../models/TestResponse.model";
import { TestScript } from "../models/TestScript.model";
import { RequestUtils } from "./request.util";
import { TestRunner } from "./TestRunner";
import { Utils } from "../utils";
import axios, { AxiosResponse } from 'axios';
import { ReporterInitiator } from "./ReporterInitiator";
import { RunEvents } from "./RunEvents";
import { HttpsProxyAgent } from "https-proxy-agent";

export class RequestRunner {
    private _xhr: XMLHttpRequest;
    private sentTime: number;

    constructor(
        private tester: TestRunner,
        private interpolationService: InterpolationService,
        private reporter: ReporterInitiator,
        private httpProxy: string
    ) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    run(req: ApiRequest): Promise<RunResult> {
        return new Promise(async (resolve, reject) => {
            if (!req.url) {
                reject({ message: 'Invalid URL.' })
                return;
            }
            let $request: CompiledApiRequest = RequestUtils.getCompiledRequest(req);
            this.reporter.emit(RunEvents.REQ_RUN_START, $request);
            let preRunResponse: TestResponse = null;
            //TODO: make this option configurable via cli options
            // const testerOption: TesterOptions = { skipinMemUpdate: false }
            if (req.prescript) {
                var script: TestScript = {
                    type: 'prescript',
                    script: $request.prescript,
                    $request,
                    envs: {
                        saved: this.interpolationService.initialEnv,
                        inMem: this.interpolationService.inMem
                    }
                };
                preRunResponse = this.tester.runScript(script);

            }

            $request = this.interpolateReq($request, req);
            let axiosReq = RequestUtils.getAxiosReq($request);
            let result: RunResult = {
                $request,
                $response: null
            }

            this.sentTime = Date.now();
            axios({
                ...axiosReq,
                ...(this.httpProxy && {proxy:false, httpsAgent: new HttpsProxyAgent(this.httpProxy, {rejectUnauthorized:false})})
            }).then(res => {
                // console.log('res----', res)
                result.$response = this.finishRun($request, preRunResponse, res);
                this.reporter.emit(RunEvents.REQ_RUN_END, result);
                // request.response = runHelper.buildResponse(res, sentTime);
                // request = scriptRunner.runScript(request, 'postscript');
                // this.finishRunRequest(request);
                resolve(result);
            }).catch(e => {
                // console.log('err----', e)
                // if (e.response) {
                //     request.response = runHelper.buildResponse(e.response, sentTime);
                //     request = scriptRunner.runScript(request, 'postscript');
                // } else {
                //     request.response = runHelper.buildResponseError(e);
                // }
                // this.finishRunRequest(request);
                if (e.response) {
                    result.$response = this.finishRun($request, preRunResponse, e.response);
                } else {
                    result.$response = this.buildResponseError(e)
                }
                this.reporter.emit(RunEvents.REQ_RUN_END, result);
                resolve(result);
            });

            // this._xhr = new XMLHttpRequest();
            // this._xhr.open($request.method, $request.url, true);

            // this.addHeadersFromObj($request.headers);
            // this._xhr.onreadystatechange = (event) => {
            //     this.onreadystatechange(event, $request, preRunResponse, resolve)
            // };


            // if ($request.bodyData) {
            //     this._xhr.send($request.bodyData);
            // } else {
            //     // req.request.body = {};
            //     this._xhr.send();
            // }
        });
    }

    private finishRun($request: CompiledApiRequest, preRunResponse: TestResponse, response: AxiosResponse): RunResponse {

        //calculating time taken
        var respTime = new Date().getTime();
        var timeDiff = respTime - this.sentTime;

        var $response: RunResponse = {
            headersStr: 'not available in apic-cli', // not available in apic-cli
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
            readyState: undefined,
            body: response.data,
            respSize: 'Unknown',
            timeTaken: timeDiff,
            timeTakenStr: Utils.formatTime(timeDiff),
            data: null,
            logs: preRunResponse?.logs || [],
            tests: preRunResponse?.tests || [],
            inMemEnvs: preRunResponse?.inMem || {},
            scriptError: preRunResponse?.scriptError || null
        };
        $response.respSize = this.getResponseSize($response)
        //convert response to json object
        try {
            $response.data = JSON.parse($response.body);
        } catch (e) {
            $response.data = {}
            // console.info('The response cant be converted to JSON');
        }

        //Run postrun script
        if ($request.postscript) {
            var script: TestScript = {
                type: 'postscript',
                script: $request.postscript,
                $request,
                $response,
                envs: {
                    saved: this.interpolationService.initialEnv,
                    inMem: this.interpolationService.inMem
                }
            };
            let postRunResponse: TestResponse = this.tester.runScript(script);
            $response.logs = [...$response.logs, ...postRunResponse.logs];
            $response.tests = [...$response.tests, ...postRunResponse.tests];
            $response.inMemEnvs = { ...$response.inMemEnvs, ...postRunResponse.inMem };
            if (postRunResponse.scriptError) {
                $response.scriptError = $response.scriptError ? $response.scriptError + '\n' + postRunResponse.scriptError : postRunResponse.scriptError;
            }
        }
        return $response;
    }



    interpolateReq($request: CompiledApiRequest, originalReq: ApiRequest): CompiledApiRequest {
        let { url, headers, queryParams, body } = $request, bodyData;
        headers = this.interpolationService.interpolateObject(headers);
        queryParams = this.interpolationService.interpolateObject(queryParams);
        url = this.interpolationService.interpolate(this.prepareQueryParams(url, queryParams || {}));
        url = RequestUtils.checkForHTTP(url);
        if (METHOD_WITH_BODY.indexOf($request.method) >= 0 && $request.bodyType) {
            switch ($request.bodyType) {
                case 'x-www-form-urlencoded':
                    body = this.interpolationService.interpolateObject(body);
                    bodyData = Utils.getUrlEncodedXForm(body);
                    break;
                case 'form-data':
                    body = this.interpolationService.interpolateObject(body);
                    let formData = originalReq.Body.formData.filter(xf => xf.key && xf.active)
                        .map(xf => {
                            return {
                                active: xf.active,
                                key: xf.key,
                                val: xf.val,
                                type: xf.type,
                                meta: xf.meta,
                            }
                        })
                    bodyData = Utils.getFormDataBody(formData);
                    break;
                case 'raw':
                    let rawBody = this.interpolationService.interpolate(originalReq.Body.rawData);
                    bodyData = rawBody;
                    if (rawBody && originalReq.Body.selectedRaw?.val?.includes('json')) {
                        try {
                            body = JSON.parse(rawBody);
                        } catch (e) {
                            console.error(`Unable to convert request body to json`, e);
                            body = rawBody;
                        }
                    } else {
                        body = rawBody;
                    }
                    break;
                case 'graphql':
                    let bodyStr = JSON.stringify($request.body);
                    bodyData = this.interpolationService.interpolate(bodyStr);
                    try {
                        body = JSON.parse(bodyData);
                    } catch (e) {
                        console.error(`Unable to convert request body to json`, e);
                        body = $request.body;
                    }
            }
        }

        return {
            ...$request,
            url,
            headers,
            queryParams,
            body,
            bodyData
        }
    }

    addHeadersFromObj(headers) {
        for (let [key, val] of Utils.objectEntries(headers)) {
            if (key) {
                var headerName = key.toUpperCase().trim();
                //   if (RESTRICTED_HEADERS.includes(headerName) || headerName.startsWith('SEC-') || headerName.startsWith('PROXY-')) {
                //     key = 'APIC-' + key;
                //   }
                try {
                    this._xhr.setRequestHeader(key, val);
                } catch (e) {
                    var m = e.message;
                    console.warn(m.slice(m.indexOf(':') + 1).trim());
                }
            }
        }
    };

    prepareQueryParams(url: string, params: { [key: string]: string }): string {
        var queryString = Utils.objectEntries(params)
            .map(([key, val]) => encodeURIComponent(key) + '=' + encodeURIComponent(val));

        if (queryString.length > 0) {
            //check if URL already has querystrings
            if (url.indexOf('?') > 0) {
                return url + '&' + queryString.join('&');
            }
            return url + '?' + queryString.join('&');
        }
        return url;
    }

    getResponseSize(resp: RunResponse) {
        var size = resp.headers['content-length'];
        if (size === undefined) {
            if (resp.body) {
                size = resp.body.length;
            }
        }
        return size === undefined ? 'Unknown' : size >= 1024 ? size >= 1048576 ? (size / 1048576).toFixed(1) + ' MB' : (size / 1024).toFixed(1) + ' KB' : size + ' B';
    }

    abort() {
        this._xhr.abort();
    }

    buildResponseError(error): RunResponse {
        return {
            status: 0,
            statusText: error.message || 'Unknown',
            body: error.message,
            timeTaken: 0,
            timeTakenStr: 'N/A',
            headers: {},
            data: {},//json body
            respSize: 'N/A',
            logs: [error.message || error.toString?.()],
            tests: [],
            inMemEnvs: {},
            scriptError: null
        };
    }
}