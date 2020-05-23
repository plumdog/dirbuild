import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import tmp from 'tmp';

import { main } from '../main';

const fsPromises = fs.promises;

describe('main', () => {
    let startingDir: string;
    let tmpObj: tmp.DirResult;
    let tmpDir: string;
    beforeEach(() => {
        startingDir = process.cwd();
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

        process.chdir(tmpDir);
    });

    afterEach(() => {
        process.chdir(startingDir);

        if (tmpObj) {
            tmpObj.removeCallback();
        }
    });

    test('runs command', async () => {
        await main([]);

        const outputFilepath = path.join(tmpDir, 'build/output.txt');
        const filedata = await fsPromises.readFile(outputFilepath, 'utf8');

        expect(filedata).toEqual('file1file2');
    });

    test('runs command for selected target', async () => {
        await main(['build']);

        const outputFilepath = path.join(tmpDir, 'build/output.txt');
        const filedata = await fsPromises.readFile(outputFilepath, 'utf8');

        expect(filedata).toEqual('file1file2');
    });

    test('rejects if multiple arguments', async () => {
        await expect(main(['build', 'foo'])).rejects.toThrow('Too many positional arguments');
    });

    test('rejects if unexpected option', async () => {
        await expect(main(['build', '--bad-option'])).rejects.toThrow('Unknown arguments: bad-option, badOption');
    });
});
