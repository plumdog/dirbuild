import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import tmp from 'tmp';

import { run } from '../main';

const fsPromises = fs.promises;

describe('simple', () => {
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
                        depends: [
                            '*.txt',
                            // 'file2.txt',
                        ],
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

    test('runs command', async () => {
        await run(tmpDir, {});

        const outputFilepath = path.join(tmpDir, 'build/output.txt');
        const filedata = await fsPromises.readFile(outputFilepath, 'utf8');

        expect(filedata).toEqual('file1file2');
    });

    test('runs command from selected target', async () => {
        // Name the target
        await run(tmpDir, {
            targetName: 'build',
        });

        const outputFilepath = path.join(tmpDir, 'build/output.txt');
        const filedata = await fsPromises.readFile(outputFilepath, 'utf8');

        expect(filedata).toEqual('file1file2');
    });

    test('repeated run does not rerun command', async () => {
        await run(tmpDir, {});
        const outputFilepath = path.join(tmpDir, 'build/output.txt');

        const outputFileStatRun1 = await fsPromises.lstat(outputFilepath);
        await run(tmpDir, {});
        const outputFileStatRun2 = await fsPromises.lstat(outputFilepath);
        // The modification file for the file should not have changed
        expect(outputFileStatRun1.mtime).toEqual(outputFileStatRun2.mtime);
    });

    test('repeated run does rerun command if a source file has changed', async () => {
        await run(tmpDir, {});
        const outputFilepath = path.join(tmpDir, 'build/output.txt');

        const outputFileStatRun1 = await fsPromises.lstat(outputFilepath);

        // Change a source file
        await fsPromises.writeFile(path.join(tmpDir, 'file1.txt'), 'changed file content');

        await run(tmpDir, {});

        const outputFileStatRun2 = await fsPromises.lstat(outputFilepath);

        // The modification file for the file be different
        expect(outputFileStatRun1.mtime).not.toEqual(outputFileStatRun2.mtime);
    });
});
