import * as path from 'path';
import md5File from 'md5-file';

interface DependencyHash {
    dependencyPath: string;
    hash: string;
}

export type DependencyHashes = Array<DependencyHash>;

export const hashDependencies = async (dirpath: string, dependencyPaths: Array<string>): Promise<DependencyHashes> => {
    return Promise.all(
        dependencyPaths.map(
            (dependencyPath: string): Promise<DependencyHash> => {
                return md5File(path.join(dirpath, dependencyPath)).then(
                    (hash: string): DependencyHash => ({
                        dependencyPath,
                        hash,
                    }),
                );
            },
        ),
    );
};
