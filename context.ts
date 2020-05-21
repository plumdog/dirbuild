import { Options } from './options';

export interface Context {
    dirpath: string;
    options: Options;
}

export const getContext = (dirpath: string, options: Options): Context => ({
    dirpath,
    options,
});
