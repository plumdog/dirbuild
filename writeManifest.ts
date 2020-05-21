import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { DependencyHashes } from './hashDependencies';

const fsPromises = fs.promises;

export type DependenciesForManifest = Record<string, string>;

export const hashesToRecord = (dependencyHashes: DependencyHashes): DependenciesForManifest => {
    const hashesRecord: DependenciesForManifest = {};
    for (const hash of dependencyHashes) {
        hashesRecord[hash.dependencyPath] = hash.hash;
    }
    return hashesRecord;
};

export const writeManifest = async (dirpath: string, targetOutput: string, dependencyHashes: DependencyHashes): Promise<void> => {
    const yamlManifest = yaml.safeDump({
        dependencies: hashesToRecord(dependencyHashes),
    });
    await fsPromises.writeFile(path.join(dirpath, targetOutput, '.dirbuildManifest.yml'), yamlManifest);
};
