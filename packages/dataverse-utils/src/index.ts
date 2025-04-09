#!/usr/bin/env node
import { program } from 'commander';

import deploy from './deploy.js';
import generate from './generate.js';

program
  .usage('<command> [options]');

// Deploy command
program
  .command('deploy')
  .description('Deploy file(s) to dataverse (webresource, assembly, pcf)')
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
