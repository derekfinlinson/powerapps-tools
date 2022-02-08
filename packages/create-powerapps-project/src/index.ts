#!/usr/bin/env node
import { Command } from 'commander';
import create from './createDataverseProject';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package');

const program = new Command(packageJson.name);

program
  .version(packageJson.version)
  .description('Create new Dataverse project')
  .usage('[type]')
  .argument('[type]', 'Type of project to generate')
  .action(type => {
    create(type);
  });

program.parse(process.argv);

if (!process.argv.slice(1).length) {
  program.outputHelp();
}