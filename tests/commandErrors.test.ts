import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import tmp from 'tmp';

import { run } from '../main';

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
                        depends: [],
                        output: './build',
                        command: 'rm -rf ./build && mkdir build/ && false',
                    },
                },
            }),
        );
    });

    afterEach(() => {
        if (tmpObj) {
            tmpObj.removeCallback();
        }
    });

    test('fails', async () => {
        await expect(run(tmpDir, {})).rejects.toThrow('Error running command');
    });
});
