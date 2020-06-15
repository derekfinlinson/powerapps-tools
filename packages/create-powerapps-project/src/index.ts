import { command, CommandModule } from 'yargs';
import create from './createPowerAppsProject';

const options: CommandModule = {
  aliases: '*',
  command: 'init',
  builder: yargs => yargs.option('type', { describe: 'Type of project to generate', alias: ['t'] }),
  describe: 'Create new powerapps project',
  handler: create
};

command(options).help().argv;
