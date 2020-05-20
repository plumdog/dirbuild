import * as util from 'util';
import glob from 'glob';
const globPromise = util.promisify(glob);

const flattenArray = <T>(arrayOfArrays: Array<Array<T>>): Array<T> => {
    const empty: Array<T> = [];
    return empty.concat(...arrayOfArrays);
};

const sortedAndUnique = <T>(array: Array<T>): Array<T> => {
    const unique = [...new Set(array)];
    return unique.sort();
};

export const resolveDependencies = async (dirpath: string, dependencies: Array<string>): Promise<Array<string>> => {
    return Promise.all(
        dependencies.map(
            (dependency: string): Promise<Array<string>> => {
                return globPromise(dependency, {
                    cwd: dirpath,
                });
            },
        ),
    )
        .then(flattenArray)
        .then(sortedAndUnique);
};
