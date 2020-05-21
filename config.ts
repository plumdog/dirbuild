import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';

const fsPromises = fs.promises;

const Target = t.type({
    depends: t.array(t.string),
    dependsExclude: t.union([t.array(t.string), t.undefined]),
    output: t.string,
    command: t.string,
});

export type Target = t.TypeOf<typeof Target>;

const Config = t.type({
    targets: t.record(t.string, Target),
});

type Config = t.TypeOf<typeof Config>;

export const getTarget = (config: Config, targetName: string | undefined): Target => {
    if (typeof targetName === 'undefined') {
        const firstTarget = Object.values(config.targets)[0];
        if (typeof firstTarget === 'undefined') {
            throw new Error('No targets to default to');
        }
        return firstTarget;
    }
    const selectedTarget = config.targets[targetName];
    if (typeof selectedTarget === 'undefined') {
        throw new Error(`Unknown target: ${targetName}`);
    }
    return selectedTarget;
};

export const loadConfig = async (configPath: string): Promise<Config> => {
    const rawConfig = await fsPromises.readFile(configPath, 'utf8');
    const unvalidatedConfig = yaml.safeLoad(rawConfig);
    const isConfig = Config.decode(unvalidatedConfig);
    if (isLeft(isConfig)) {
        throw new Error('Invalid config');
    }
    return isConfig.right;
};
