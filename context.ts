import { getLogger, Logger } from './logger';
import { Options } from './options';

export interface Context {
    dirpath: string;
    options: Options;
    log: Logger;
}

export const getContext = (dirpath: string, options: Options): Context => ({
    dirpath,
    options,
    log: getLogger(options),
});
