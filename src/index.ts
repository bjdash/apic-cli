import { AgentRunOption } from "./models/AgentRunOptions.model";
import { Runner } from "./runner/SuiteRunner";
import { Agent } from './agent'
import { DefaultAgentOptions } from "./constants";

export async function runSuite(suitPath, options) {
    const runner = new Runner(suitPath, options);
    await runner.initializeAndValidate();
    runner.run();
}

export function startAgent(options: AgentRunOption) {
    if (!options) options = DefaultAgentOptions;
    if (!options.port) options.port = DefaultAgentOptions.port;
    const agent = new Agent(options);
    agent.start();
}