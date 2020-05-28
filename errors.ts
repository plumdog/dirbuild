export class DirbuildError extends Error {
    readonly prefix: string = 'UnknownError';
    readonly exitCode: number = 1;

    constructor(message: string) {
        super(message);
        this.message = `${this.prefix}: ${message}`;
    }
}

export class ArgumentsError extends DirbuildError {
    readonly prefix = 'ArgumentsError';
}

export class ConfigError extends DirbuildError {
    readonly prefix = 'ConfigError';
}

export class CommandError extends DirbuildError {
    readonly prefix = 'CommandError';
}
