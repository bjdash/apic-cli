import { AgentRunOption } from "./models/AgentRunOptions.model";
import { Runner } from "./runner/SuiteRunner";
import { Agent } from './agent'
import { AgentOptions } from "./constants";

export async function runSuite(suitPath, options) {
    const runner = new Runner(suitPath, options);
    await runner.initializeAndValidate();
    runner.run();
}

export function startAgent(options: AgentRunOption) {
    if (!options) options = AgentOptions;
    if (!options.port) options.port = AgentOptions.port;
    const agent = new Agent(options);
    agent.start();
}