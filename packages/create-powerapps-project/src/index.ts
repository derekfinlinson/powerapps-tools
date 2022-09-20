#!/usr/bin/env node
import path from 'node:path';
import { Plop, run } from 'plop';
import minimist from 'minimist';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

const argv = minimist(process.argv.slice(2));

if (argv.version || argv.v) {
  console.log(`${packageJson.version}`);
} else {
  Plop.launch({
    cwd: process.cwd(),
    configPath: path.join(__dirname, 'plopfile.js')
  }, env => {
    const options = {
      ...env,
      dest: process.cwd()
    };
    return run(options, undefined, true)
  });
}
