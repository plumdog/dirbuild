import * as util from 'util';
import * as childProcess from 'child_process';

import { Target, getTarget, loadConfig } from './config';

import { resolveDependencies } from './findDependencies';
import { hashDependencies } from './hashDependencies';
import { checkManifest } from './checkManifest';
import { writeManifest } from './writeManifest';
import { getOptions, Options } from './options';
import { getContext, Context } from './context';

const execPromise = util.promisify(childProcess.exec);

const runTarget = async (context: Context, target: Target): Promise<void> => {
    const dirpath = context.dirpath;
    const dependsOnFiles = await resolveDependencies(dirpath, target.depends, target.dependsExclude || []);
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

export const run = async (dirpath: string, options: Partial<Options>): Promise<void> => {
    const opts = getOptions(options);
    const context = getContext(dirpath, opts);

    const config = await loadConfig(context);
    const target = getTarget(context, config);
    await runTarget(context, target);
};
