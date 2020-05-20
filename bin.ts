#!/usr/bin/env node

import { run } from './main';

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
        console.error('Unhandled error', err);
        process.exit(1);
    });
