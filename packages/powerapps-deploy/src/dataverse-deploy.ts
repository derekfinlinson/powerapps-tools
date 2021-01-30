#!/usr/bin/env node
import { program } from 'commander';
import { spawn } from 'child_process';

import deploy from './deploy';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const electron = require('electron');

program
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require('../package').version)
  .usage('<command> [options]');

// Auth command
program
  .command('auth')
  .description('Authenticate to dataverse')
  .action(() => {
    const child = spawn(electron, [`${__dirname}/.`], {
      stdio: 'inherit',
      windowsHide: false
    });

    child.on('close', code => {
      process.exit(code || undefined);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['SIGINT', 'SIGTERM'].forEach((signal: any) => {
      process.on(signal, () => {
        if (!child.killed) {
          child.kill(signal);
        }
      });
    });
  });

// Deploy command
program
  .command('deploy [type] [files]')
  .description('Deploy file(s) to dataverse (webresource, plugin, workflow)', {
    type: 'Type of project to deploy',
    files: 'Comma separated list of files to deploy'
  })
  .action((type, files) => {
    deploy(type, files);
  });

// Show help on unknown command
program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp();
    console.log();
    console.log(`Unknown command ${cmd}.`);
    console.log();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
