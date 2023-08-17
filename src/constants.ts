import { RunOption } from "./models/RunOption.model";

export const Reporters = {
    available: ['cli', 'junit'],
    default: ['cli'],
    path: './reporters/'
}

export const DefaultRunOptions: RunOption = {
    reporters: '',
    reportersJunitPath: './apic-reports'
}

export const METHOD_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const DefaultAgentOptions = {
    port: 8008
}