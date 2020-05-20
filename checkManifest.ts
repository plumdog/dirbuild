import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import deepEqual from 'deep-equal';
import { DependencyHashes } from './hashDependencies';
import { hashesToRecord } from './writeManifest';

const fsPromises = fs.promises;

export const checkManifest = async (dirpath: string, targetOutput: string, dependencyHashes: DependencyHashes): Promise<boolean> => {
    let rawManifest;
    try {
        rawManifest = await fsPromises.readFile(path.join(dirpath, targetOutput, '.dirbuildManifest.yml'), 'utf8');
    } catch (err) {
        console.log('No manifest, return false');
        // Unable to read existing manifest
        return false;
    }
    const manifestYaml = yaml.safeLoad(rawManifest);
    const areEqual = deepEqual(manifestYaml.dependencies, hashesToRecord(dependencyHashes));
    console.log('areEqual', areEqual);
    return areEqual;
};
