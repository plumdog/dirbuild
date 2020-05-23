#!/usr/bin/env node

import { main } from './main';

main(process.argv.slice(2))
    .then(() => {
        process.exit(0);
    })
    .catch((err: Error) => {
        console.error('Unhandled error', err);
        process.exit(1);
    });
