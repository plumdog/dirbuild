import * as path from 'path';
import * as fs from 'fs';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import * as yaml from 'js-yaml';
import { DependencyHashes } from './hashDependencies';
import { hashesToRecord, DependenciesForManifest } from './writeManifest';

const fsPromises = fs.promises;

const Manifest = t.type({
    dependencies: t.record(t.string, t.string),
});

export const dependenciesMatch = (fromManifest: DependenciesForManifest, forManifest: DependenciesForManifest): boolean => {
    const unmatchedKeys = new Set(Object.keys(forManifest));
    for (const [key, value] of Object.entries(fromManifest)) {
        if (!(key in forManifest)) {
            return false;
        }
        if (value !== forManifest[key]) {
            return false;
        }
        unmatchedKeys.delete(key);
    }

    if (unmatchedKeys.size) {
        return false;
    }

    return true;
};

export const checkManifest = async (dirpath: string, targetOutput: string, dependencyHashes: DependencyHashes): Promise<boolean> => {
    let rawManifest;
    try {
        rawManifest = await fsPromises.readFile(path.join(dirpath, targetOutput, '.dirbuildManifest.yml'), 'utf8');
    } catch (err) {
        console.log('No manifest, return false');
        // Unable to read existing manifest
        return false;
    }
    const manifestYaml: unknown = yaml.safeLoad(rawManifest);
    const isManifest = Manifest.decode(manifestYaml);
    if (isLeft(isManifest)) {
        return false;
    }
    const manifest = isManifest.right;
    const areEqual = dependenciesMatch(manifest.dependencies, hashesToRecord(dependencyHashes));
    console.log('areEqual', areEqual);
    return areEqual;
};
