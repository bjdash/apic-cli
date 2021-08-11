import { bgRed, blue } from "colors";

export class Logger {
    static error(msg: string) {
        console.log(bgRed(msg));
    }

    static info(msg1: string, msg2?: string) {
        console.log(msg1, blue(msg2 ? ': ' + msg2 : ''));
    }

}

