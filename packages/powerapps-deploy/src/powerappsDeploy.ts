import yargs from 'yargs';
import prompts from 'prompts';

import { deployAssembly } from './assemblyDeploy';
import { deployWebResource } from './webResourceDeploy';

export default async function deploy(argv: yargs.Arguments): Promise<void> {
  if (!argv.type || (argv.type !== 'webresource' && argv.type !== 'assembly')) {
    const invalid = argv.type !== undefined && argv.type !== 'webresource' && argv.type !== 'assembly';

    const invalidMessage = invalid ? `${argv.type} is not a valid project type.` : '';

    const { type } = await prompts({
      type: 'select',
      name: 'type',
      message: `${invalidMessage} Select project type to deploy`,
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' }
      ]
    });

    argv.type = type;
  }

  switch (argv.type) {
    case 'webresource':
      await deployWebResource(argv.files as string);
      break;
    case 'assembly':
      await deployAssembly();
      break;
    default:

  }
}