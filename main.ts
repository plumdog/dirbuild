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
    const hashes = await hashDependencies(dirpath, dependsOnFiles);

    const manifestCheck = await checkManifest(dirpath, target.output, hashes);
    if (!manifestCheck.needsUpdate) {
        context.log.info('Hashes match, nothing to do');
        return;
    }

    context.log.debug(manifestCheck.reason);
    context.log.info('Need to rebuild...');

    const { stdout, stderr } = await execPromise(target.command, {
        shell: '/bin/bash',
        cwd: dirpath,
    });
    if (stdout) {
        context.log.info(stdout);
    }
    if (stderr) {
        context.log.error(stderr);
    }
    context.log.info('Rebuild done');

    context.log.debug('Writing manifest...');
    await writeManifest(dirpath, target.output, hashes);
    context.log.debug('Writing manifest done');
};

export const run = async (dirpath: string, options: Partial<Options>): Promise<void> => {
    const opts = getOptions(options);
    const context = getContext(dirpath, opts);

    const config = await loadConfig(context);
    const target = getTarget(context, config);
    await runTarget(context, target);
};
