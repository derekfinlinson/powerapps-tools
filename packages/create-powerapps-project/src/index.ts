#!/usr/bin/env node
import { Plop, run } from 'plop';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

Plop.prepare(
  {
    cwd: process.cwd(),
    configPath: path.join(__dirname, 'plopfile.js')
  },
  (env) => {
    const options = {
      ...env,
      dest: process.cwd()
    };
    return run(options, undefined, true);
  }
);
