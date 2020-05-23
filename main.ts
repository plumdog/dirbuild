import { Writable } from 'stream';
import * as childProcess from 'child_process';

import { Target, getTarget, loadConfig } from './config';

import { resolveDependencies } from './findDependencies';
import { hashDependencies } from './hashDependencies';
import { checkManifest } from './checkManifest';
import { writeManifest } from './writeManifest';
import { getOptions, Options } from './options';
import { getContext, Context } from './context';

class StdoutWritable extends Writable {
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        process.stdout.write(chunk.toString());
        callback();
    }
}

class StderrWritable extends Writable {
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        process.stderr.write(chunk.toString());
        callback();
    }
}

const execPromisePipeIO = (command: string, options: childProcess.ExecOptions): Promise<void> => {
    return new Promise((res, rej) => {
        const process = childProcess.exec(command, options, (error: childProcess.ExecException | null): void => {
            if (error) {
                rej(error);
            } else {
                res();
            }
        });
        process.stdout.pipe(new StdoutWritable());
        process.stderr.pipe(new StderrWritable());
    });
};

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
    context.log.info('Need to rerun command ...');

    context.log.info(`Running command: ${target.command}`);
    context.log.info('---');
    try {
        await execPromisePipeIO(target.command, {
            shell: '/bin/bash',
            cwd: dirpath,
        });
    } catch (err) {
        context.log.info('---');
        context.log.error('Error running command');
        throw new Error('Error running command');
    }
    context.log.info('---');
    context.log.info('Command exited successfully');

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
