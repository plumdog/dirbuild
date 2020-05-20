import * as path from 'path';
import * as util from 'util';
import * as childProcess from 'child_process';

import { Target, getTarget, loadConfig } from './config';

import { resolveDependencies } from './findDependencies';
import { hashDependencies } from './hashDependencies';
import { checkManifest } from './checkManifest';
import { writeManifest } from './writeManifest';

const execPromise = util.promisify(childProcess.exec);

const runTarget = async (dirpath: string, target: Target): Promise<void> => {
    const dependsOnFiles = await resolveDependencies(dirpath, target.depends);
    // console.log('depends', JSON.stringify(dependsOnFiles, null, 2));
    const hashes = await hashDependencies(dirpath, dependsOnFiles);
    // console.log('hashes', JSON.stringify(hashes, null, 2));

    if (await checkManifest(dirpath, target.output, hashes)) {
        console.log('Hashes match, nothing to do');
        return;
    }

    console.log('Hashes do not match, need to rebuild');

    const { stdout, stderr } = await execPromise(target.command, {
        shell: '/bin/bash',
        cwd: dirpath,
    });
    console.log(stdout);
    console.error(stderr);

    await writeManifest(dirpath, target.output, hashes);
};

export const run = async (dirpath: string, targetName: string | undefined): Promise<void> => {
    const configPath = path.join(dirpath, '.dirbuild.yml');
    const config = await loadConfig(configPath);
    const target = getTarget(config, targetName);
    await runTarget(dirpath, target);
};
