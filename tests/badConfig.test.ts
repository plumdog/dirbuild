import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import tmp from 'tmp';

import { run } from '../main';

describe('badConfig', () => {
    let tmpObj: tmp.DirResult;
    let tmpDir: string;
    beforeEach(() => {
        tmpObj = tmp.dirSync({
            unsafeCleanup: true,
        });
        tmpDir = tmpObj.name;

        fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'file1');
        fs.writeFileSync(path.join(tmpDir, 'file2.txt'), 'file2');
    });

    afterEach(() => {
        if (tmpObj) {
            tmpObj.removeCallback();
        }
    });

    test('errors if config file is not parseable', async () => {
        fs.writeFileSync(path.join(tmpDir, '.dirbuild.yml'), 'this is not valid yaml { :');

        await expect(run(tmpDir, {})).rejects.toThrow('Invalid config');
    });

    test('repeated run does not rerun command', async () => {
        fs.writeFileSync(
            path.join(tmpDir, '.dirbuild.yml'),
            yaml.safeDump({
                thisIsYaml: 'but the wrong shape',
            }),
        );

        await expect(run(tmpDir, {})).rejects.toThrow('Invalid config');
    });

    test('no targets, run default', async () => {
        fs.writeFileSync(
            path.join(tmpDir, '.dirbuild.yml'),
            yaml.safeDump({
                // The right shape, but has no targets
                targets: {},
            }),
        );

        await expect(run(tmpDir, {})).rejects.toThrow('No targets to default to');
    });

    test('no targets, run selected', async () => {
        fs.writeFileSync(
            path.join(tmpDir, '.dirbuild.yml'),
            yaml.safeDump({
                // The right shape, but has no targets
                targets: {},
            }),
        );

        await expect(
            run(tmpDir, {
                targetName: 'nosuchtarget',
            }),
        ).rejects.toThrow('Unknown target: nosuchtarget');
    });
});
