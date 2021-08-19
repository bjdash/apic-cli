import { CompiledApiRequest } from "./CompiledRequest.model";
import { ApiRequest } from "./Request.model";

export interface AgentRunRequest {
    request: ApiRequest,
    envs: {
        saved: { [key: string]: string },
        inMem: { [key: string]: string }
    }
}