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
                        depends: ['*.txt'],
                        dependsExclude: ['file2.txt'],
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

    test('changing excluded file does not result in command rerun', async () => {
        await run(tmpDir, undefined);
        const outputFilepath = path.join(tmpDir, 'build/output.txt');

        const outputFileStatRun1 = await fsPromises.lstat(outputFilepath);

        // Change an excluded
        await fsPromises.writeFile(path.join(tmpDir, 'file2.txt'), 'changed file content');

        await run(tmpDir, undefined);

        const outputFileStatRun2 = await fsPromises.lstat(outputFilepath);

        // The modification time for the file should be the same
        expect(outputFileStatRun1.mtime).toEqual(outputFileStatRun2.mtime);
    });

    test('changing non excluded file does result in command rerun', async () => {
        await run(tmpDir, undefined);
        const outputFilepath = path.join(tmpDir, 'build/output.txt');

        const outputFileStatRun1 = await fsPromises.lstat(outputFilepath);

        // Change a non excluded source file
        await fsPromises.writeFile(path.join(tmpDir, 'file1.txt'), 'changed file content');

        await run(tmpDir, undefined);

        const outputFileStatRun2 = await fsPromises.lstat(outputFilepath);

        // The modification time for the file should have changed
        expect(outputFileStatRun1.mtime).not.toEqual(outputFileStatRun2.mtime);
    });
});
