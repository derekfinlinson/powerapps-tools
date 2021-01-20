import { command, CommandModule } from 'yargs';
import deploy from './dataverseDeploy';

const options: CommandModule = {
  aliases: '*',
  command: 'deploy [type] [files]',
  builder: yargs => {
    yargs.option('type', { describe: 'Type of project to deploy', alias: ['t'] });
    yargs.option('files', { describe: 'Comma separate list of files to deploy', alias: ['f'] });

    return yargs;
  },
  describe: 'Deploy powerapps project',
  handler: (argv) => {
    deploy(argv);
  }
};

command(options).help().argv;
