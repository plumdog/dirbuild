#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import * as util from "util";
import * as childProcess from "child_process";

import deepEqual from "deep-equal";
import * as yaml from "js-yaml";
import glob from "glob";
import * as t from "io-ts";
import { isLeft } from "fp-ts/lib/Either";
import md5File from "md5-file";

const fsPromises = fs.promises;
const execPromise = util.promisify(childProcess.exec);
const globPromise = util.promisify(glob);

const Target = t.type({
  depends: t.array(t.string),
  output: t.string,
  command: t.string
});

type Target = t.TypeOf<typeof Target>;

const Config = t.type({
  targets: t.record(t.string, Target)
});

type Config = t.TypeOf<typeof Config>;

const getTarget = (config: Config, targetName: string | undefined): Target => {
  if (typeof targetName === "undefined") {
    const firstTarget = Object.values(config.targets)[0];
    if (typeof firstTarget === "undefined") {
      throw new Error("No targets to default to");
    }
    return firstTarget;
  }
  const selectedTarget = config.targets[targetName];
  if (typeof selectedTarget === "undefined") {
    throw new Error(`Unknown target: ${targetName}`);
  }
  return selectedTarget;
};

const flattenArray = <T>(arrayOfArrays: Array<Array<T>>): Array<T> => {
  const empty: Array<T> = [];
  return empty.concat(...arrayOfArrays);
};

const sortedAndUnique = <T>(array: Array<T>): Array<T> => {
  const unique = [...new Set(array)];
  return unique.sort();
};

const resolveDependencies = async (
  dirpath: string,
  dependencies: Array<string>
): Promise<Array<string>> => {
  return Promise.all(
    dependencies.map(
      (dependency: string): Promise<Array<string>> => {
        return globPromise(dependency);
      }
    )
  )
    .then(flattenArray)
    .then(sortedAndUnique);
};

interface DependencyHash {
  dependencyPath: string;
  hash: string;
}

type DependencyHashes = Array<DependencyHash>;

const hashDependencies = async (
  dirpath: string,
  dependencyPaths: Array<string>
): Promise<DependencyHashes> => {
  return Promise.all(
    dependencyPaths.map(
      (dependencyPath: string): Promise<DependencyHash> => {
        return md5File(path.join(dirpath, dependencyPath)).then(
          (hash: string): DependencyHash => ({
            dependencyPath,
            hash
          })
        );
      }
    )
  );
};

const hashesToRecord = (
  dependencyHashes: DependencyHashes
): Record<string, string> => {
  const hashesRecord: Record<string, string> = {};
  for (const hash of dependencyHashes) {
    hashesRecord[hash.dependencyPath] = hash.hash;
  }
  return hashesRecord;
};

const checkManifest = async (
  dirpath: string,
  targetOutput: string,
  dependencyHashes: DependencyHashes
): Promise<boolean> => {
  let rawManifest;
  try {
    rawManifest = await fsPromises.readFile(
      path.join(dirpath, targetOutput, ".dirbuildManifest.yml"),
      "utf8"
    );
  } catch (err) {
    console.log("No manifest, return false");
    // Unable to read existing manifest
    return false;
  }
  const manifestYaml = yaml.safeLoad(rawManifest);
  const areEqual = deepEqual(
    manifestYaml.dependencies,
    hashesToRecord(dependencyHashes)
  );
  console.log("areEqual", areEqual);
  return areEqual;
};

const writeManifest = async (
  dirpath: string,
  targetOutput: string,
  dependencyHashes: DependencyHashes
): Promise<void> => {
  const yamlManifest = yaml.safeDump({
    dependencies: hashesToRecord(dependencyHashes)
  });
  await fsPromises.writeFile(
    path.join(dirpath, targetOutput, ".dirbuildManifest.yml"),
    yamlManifest
  );
};

const runTarget = async (dirpath: string, target: Target): Promise<void> => {
  const dependsOnFiles = await resolveDependencies(dirpath, target.depends);
  // console.log('depends', JSON.stringify(dependsOnFiles, null, 2));
  const hashes = await hashDependencies(dirpath, dependsOnFiles);
  // console.log('hashes', JSON.stringify(hashes, null, 2));

  if (await checkManifest(dirpath, target.output, hashes)) {
    console.log("Hashes match, nothing to do");
    return;
  }

  console.log("Hashes do not match, need to rebuild");

  const { stdout, stderr } = await execPromise(target.command, {
    shell: "/bin/bash",
    cwd: dirpath
  });
  console.log(stdout);
  console.error(stderr);

  await writeManifest(dirpath, target.output, hashes);
};

const run = async (
  dirpath: string,
  targetName: string | undefined
): Promise<void> => {
  const configPath = path.join(dirpath, ".dirbuild.yml");
  const rawConfig = await fsPromises.readFile(configPath, "utf8");
  const unvalidatedConfig = yaml.safeLoad(rawConfig);

  const isConfig = Config.decode(unvalidatedConfig);
  if (isLeft(isConfig)) {
    throw new Error("Invalid config");
  }
  const config = isConfig.right;

  const target = getTarget(config, targetName);
  await runTarget(dirpath, target);
};

const main = async (args: Array<string>): Promise<void> => {
  if (args.length > 1) {
    process.exit(1);
  }
  await run(process.cwd(), args[0]);
};

main(process.argv.slice(2))
  .then(() => {
    process.exit(0);
  })
  .catch((err: Error) => {
    console.error("Unhandled error", err);
    process.exit(1);
  });
