export interface Options {
    targetName: string | undefined;
    verbose: boolean;
    silent: boolean;
}

export const defaultOptions: Options = {
    targetName: undefined,
    verbose: false,
    silent: false,
};

export const getOptions = (options: Partial<Options>): Options => {
    return {
        ...defaultOptions,
        ...options,
    };
};
