import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import tmp from 'tmp';

import { run } from '../main';

const fsPromises = fs.promises;

describe('logger', () => {
    let tmpObj: tmp.DirResult;
    let tmpDir: string;
    beforeEach(() => {
        tmpObj = tmp.dirSync({
            unsafeCleanup: true,
        });
        tmpDir = tmpObj.name;

        fs.writeFileSync(
            path.join(tmpDir, '.dirbuild.yml'),
            yaml.safeDump({
                targets: {
                    build: {
                        depends: ['*.txt'],
                        output: './build',
                        command: 'rm -rf ./build && mkdir build/ && cat file1.txt file2.txt > build/output.txt',
                    },
                },
            }),
        );

        fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'file1');
        fs.writeFileSync(path.join(tmpDir, 'file2.txt'), 'file2');
    });

    afterEach(() => {
        if (tmpObj) {
            tmpObj.removeCallback();
        }
    });

    test('runs command silent', async () => {
        await run(tmpDir, {
            silent: true,
        });

        const outputFilepath = path.join(tmpDir, 'build/output.txt');
        const filedata = await fsPromises.readFile(outputFilepath, 'utf8');

        expect(filedata).toEqual('file1file2');
    });

    test('runs command verbose', async () => {
        await run(tmpDir, {
            verbose: true,
        });

        const outputFilepath = path.join(tmpDir, 'build/output.txt');
        const filedata = await fsPromises.readFile(outputFilepath, 'utf8');

        expect(filedata).toEqual('file1file2');
    });
});

describe('logger of command stdout and stderr', () => {
    let tmpObj: tmp.DirResult;
    let tmpDir: string;
    beforeEach(() => {
        tmpObj = tmp.dirSync({
            unsafeCleanup: true,
        });
        tmpDir = tmpObj.name;
    });

    afterEach(() => {
        if (tmpObj) {
            tmpObj.removeCallback();
        }
    });

    test('runs command outputs from stdout', async () => {
        fs.writeFileSync(
            path.join(tmpDir, '.dirbuild.yml'),
            yaml.safeDump({
                targets: {
                    build: {
                        depends: [],
                        output: './build',
                        command: 'rm -rf ./build && mkdir build/ && echo stdout',
                    },
                },
            }),
        );

        await run(tmpDir, {});
    });

    test('runs command outputs from stderr', async () => {
        fs.writeFileSync(
            path.join(tmpDir, '.dirbuild.yml'),
            yaml.safeDump({
                targets: {
                    build: {
                        depends: [],
                        output: './build',
                        command: 'rm -rf ./build && mkdir build/ && >&2 echo stderr',
                    },
                },
            }),
        );

        await run(tmpDir, {});
    });
});
