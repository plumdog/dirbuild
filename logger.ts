import { Options } from './options';

type LogFn = (message: string) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NullLogFn: LogFn = (message: string) => {
    // Log nothing
};
const StdoutLogFn: LogFn = (message: string): void => {
    console.log(message);
};
const StderrLogFn: LogFn = (message: string): void => {
    console.error(message);
};

export interface Logger {
    error: LogFn;
    info: LogFn;
    debug: LogFn;
}

export const getLogger = (options: Options): Logger => {
    if (options.silent) {
        return {
            error: NullLogFn,
            info: NullLogFn,
            debug: NullLogFn,
        };
    }

    return {
        error: StderrLogFn,
        info: StdoutLogFn,
        debug: options.verbose ? StdoutLogFn : NullLogFn,
    };
};
