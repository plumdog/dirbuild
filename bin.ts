#!/usr/bin/env node

import { main } from './main';
import { DirbuildError } from './errors';

main(process.argv.slice(2))
    .then(() => {
        process.exit(0);
    })
    .catch((err: Error) => {
        if (err instanceof DirbuildError) {
            console.error(err.message);
            process.exit(err.exitCode);
        } else {
            console.error('Unhandled error', err);
            process.exit(255);
        }
    });
