#!/usr/bin/env node
import { program } from 'commander';

import deploy from './deploy';
import generate from './generate';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

program
  .version(packageJson.version)
  .usage('<command> [options]');

// Deploy command
program
  .command('deploy')
  .description('Deploy file(s) to dataverse (webresource, plugin, workflow)')
  .argument('[type]', 'Type of project to deploy')
  .argument('[files]', 'Comma separate list of files to deploy')
  .action((type, files) => {
    deploy(type, files);
  });

// Generate command
program
  .command('generate')
  .description('Generate early-bound TypeScript file for specified table')
  .argument('[table]', 'Table to generate')
  .action((table) => {
    generate(table);
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
