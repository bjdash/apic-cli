import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { DefaultAgentOptions } from "../constants";
import { AgentRunOption } from "../models/AgentRunOptions.model";
import { bgGreen, bgRed, white } from "colors/safe";
import { AgentEvents } from "./events";
import { AgentRunRequest } from "../models/AgentRunRequest.model";
import { InterpolationService } from "../runner/InterpolationService";
import { TestRunner } from "../runner/TestRunner";
import { RequestRunner } from "../runner/RequestRunner";
import { ReporterInitiator } from "../runner/ReporterInitiator";
import { RunResult } from "../models/RunResult.model";

export class Agent {
    constructor(private agentOptions: AgentRunOption) {
        if (!agentOptions.port) agentOptions.port = DefaultAgentOptions.port;
    }

    start() {
        const httpServer = createServer();
        const io = new Server(httpServer, {
            path: "/apic-agent",
            serveClient: false,
            allowEIO3: true,
            cors: {
                origin: ["https://apic.app", 'http://localhost:5000'],
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on("connection", (socket: Socket) => {
            socket.on(AgentEvents.RUN_REQUEST, async (arg: AgentRunRequest) => {
                const interpolator = new InterpolationService(arg.envs.saved, arg.envs.inMem);
                const testRunner = new TestRunner(interpolator);
                const reporter = new ReporterInitiator({ reporters: 'cli', responseData: true });
                const reqRunner = new RequestRunner(testRunner, interpolator, reporter, this.agentOptions.proxy);
                let result: RunResult = await reqRunner.run(arg.request);
                socket.emit(AgentEvents.RUN_REQUEST_DONE, result)
            });
        });

        httpServer.listen(this.agentOptions.port, () => {
            console.log(bgGreen(`Apic agent started on port ${this.agentOptions.port}`));
            console.log('To know more on how to use apic agent visit https://docs.apic.app/apic-web-agent-apic-cli');

        }).on('error', (err) => {
            console.log(bgRed(`Apic agent failed to start on port ${this.agentOptions.port}`));
            console.log(err)
        });
    }
}
