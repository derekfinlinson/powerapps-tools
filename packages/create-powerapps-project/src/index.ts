import { command, CommandModule } from 'yargs';
import create from './createDataverseProject';

const options: CommandModule = {
  aliases: '*',
  command: 'init',
  builder: yargs => yargs.option('type', { describe: 'Type of project to generate', alias: ['t'] }),
  describe: 'Create new dataverse project',
  handler: create
};

command(options).help().argv;
