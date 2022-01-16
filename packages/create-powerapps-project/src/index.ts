#!/usr/bin/env node
import { program } from 'commander';
import create from './createDataverseProject';

program
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require('../package').version)
  .usage('<command> [options]');

// Deploy command
program
  .command('init')
  .description('Create new Dataverse project')
  .argument('[type]', 'Type of project to generate')
  .action((type) => {
    create(type);
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

if (!process.argv.slice(1).length) {
  program.outputHelp();
}