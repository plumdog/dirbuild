import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import tmp from 'tmp';

import { run } from '../main';

const fsPromises = fs.promises;

describe('manifest', () => {
    let tmpObj: tmp.DirResult;
    let tmpDir: string;
    beforeEach(async () => {
        tmpObj = tmp.dirSync({
            unsafeCleanup: true,
        });
        tmpDir = tmpObj.name;

        await fsPromises.writeFile(
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
        await fsPromises.writeFile(path.join(tmpDir, 'file1.txt'), 'file1');
        await fsPromises.writeFile(path.join(tmpDir, 'file2.txt'), 'file2');

        // Run it once at the start so we have a manifest to play with
        await run(tmpDir, undefined);
    });

    afterEach(() => {
        if (tmpObj) {
            tmpObj.removeCallback();
        }
    });

    test('invalid manifest file just reruns', async () => {
        await fsPromises.writeFile(path.join(tmpDir, './build/.dirbuildManifest.yml'), 'this is not a valid file');

        const initialMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        await run(tmpDir, undefined);
        const afterMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        // Should have rerun the command
        expect(initialMtime).not.toEqual(afterMtime);
    });

    test('no manifest file just reruns', async () => {
        await fsPromises.unlink(path.join(tmpDir, './build/.dirbuildManifest.yml'));

        const initialMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        await run(tmpDir, undefined);
        const afterMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        // Should have rerun the command
        expect(initialMtime).not.toEqual(afterMtime);
    });

    test('verify initial manifest has expected content', async () => {
        // This is not really a test, but rather verification that the
        // other tests that manually fudge the manifest are working
        // from the expected baseline
        const content = await fsPromises.readFile(path.join(tmpDir, './build/.dirbuildManifest.yml'), 'utf8');
        const manifest = yaml.safeLoad(content);
        expect(Object.keys(manifest.dependencies).sort()).toEqual(['file1.txt', 'file2.txt']);
        expect(manifest.dependencies['file1.txt']).toEqual('826e8142e6baabe8af779f5f490cf5f5');
        expect(manifest.dependencies['file2.txt']).toEqual('1c1c96fd2cf8330db0bfa936ce82f3b9');
    });

    test('dependency missing from manifest causes rebuild', async () => {
        // Fudge the manifest to remove file2
        const manifestPath = path.join(tmpDir, './build/.dirbuildManifest.yml');
        const manifest = yaml.safeLoad(await fsPromises.readFile(manifestPath, 'utf8'));
        delete manifest.dependencies['file2.txt'];
        await fsPromises.writeFile(manifestPath, yaml.safeDump(manifest));

        const initialMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        await run(tmpDir, undefined);
        const afterMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        // Should have rerun the command
        expect(initialMtime).not.toEqual(afterMtime);
    });

    test('extra dependency in manifest causes rebuild', async () => {
        // Fudge the manifest to remove file2
        const manifestPath = path.join(tmpDir, './build/.dirbuildManifest.yml');
        const manifest = yaml.safeLoad(await fsPromises.readFile(manifestPath, 'utf8'));
        manifest.dependencies['newfile.txt'] = 'abc';
        await fsPromises.writeFile(manifestPath, yaml.safeDump(manifest));

        const initialMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        await run(tmpDir, undefined);
        const afterMtime = (await fsPromises.lstat(path.join(tmpDir, './build/output.txt'))).mtime;
        // Should have rerun the command
        expect(initialMtime).not.toEqual(afterMtime);
    });
});
