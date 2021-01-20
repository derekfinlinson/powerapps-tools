import { command, CommandModule } from 'yargs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const electron = require('electron');
import proc from "child_process";

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
    const currentDir = __dirname;
    const child = proc.spawn(electron, [currentDir + "/.", ...[argv.type as string, argv.files as string]], {
      stdio: "inherit",
      windowsHide: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    child.on("close", function (code: any) {
      process.exit(code);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-function-return-type
    const handleTerminationSignal = function (signal: any) {
      process.on(signal, function signalHandler() {
        if (!child.killed) {
          child.kill(signal);
        }
      });
    };

    handleTerminationSignal("SIGINT");
    handleTerminationSignal("SIGTERM");
  }
};

command(options).help().argv;
