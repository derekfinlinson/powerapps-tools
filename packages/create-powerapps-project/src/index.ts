#!/usr/bin/env node
import path from 'node:path';
import { Plop, run } from 'plop';

Plop.launch({
  cwd: process.cwd(),
  configPath: path.join(__dirname, 'plopfile.js')
}, env => {
  const options = {
    ...env,
    dest: process.cwd() // this will make the destination path to be based on the cwd when calling the wrapper
  };
  return run(options, undefined, true)
});
