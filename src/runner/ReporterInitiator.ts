import EventEmitter from "events";
import { RunOption } from "../models/RunOption.model";
import { bgRed, red } from "colors";
import { RunEvents } from "./RunEvents";
import { Reporters } from "../constants";
import { Logger } from "./logger";

export class ReporterInitiator {
    eventEmitter;
    reporters: string[]

    constructor(options: RunOption) {
        var reporterNames = [];
        if (options.reporters) {
            reporterNames = options.reporters.split(',');
        }
        // add default reporters if not specified
        Reporters.default.forEach(reporter => {
            if (reporterNames.indexOf(reporter) < 0) reporterNames.push(reporter);
        });

        // load reporter path for built-in reporters
        const reportersToLoad = reporterNames.map(name => {
            return Reporters.available.indexOf(name) >= 0 ? (Reporters.path + name) : name;
        });
        this.eventEmitter = new EventEmitter();
        this.reporters = [];
        reportersToLoad.forEach(reporterPath => {
            try {
                let reporter = require(reporterPath);
                this.reporters.push(new reporter.default(this.eventEmitter, options));
            } catch (e) {
                if (e.message.indexOf('Cannot find module') >= 0) {
                    console.log(bgRed('ERROR:') + red(` ${reporterPath} is not a valid reporter`));
                    throw new Error('Provided reporter not supported.')
                } else {
                    console.error(e);
                    throw new Error(e);
                }
            }
            Logger.info('Loaded reporter:', reporterPath)
        });
    }

    emit(eventName: RunEvents, data: any) {
        this.eventEmitter.emit(eventName, data);
    }

    getReporters() {
        return this.reporters;
    }
}