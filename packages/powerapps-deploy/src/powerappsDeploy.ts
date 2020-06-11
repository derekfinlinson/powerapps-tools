import yargs from 'yargs';
import prompts from 'prompts';

import { deployAssembly } from './assemblyDeploy';
import { deployWebResource } from './webResourceDeploy';

export default async function deploy(argv: yargs.Arguments): Promise<void> {
  if (!argv.type) {
    const { type } = await prompts({
      type: 'select',
      name: 'type',
      message: 'enter project type',
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' }
      ]
    });
  }

  switch (argv.type) {
    case 'webresource':
      await deployWebResource(argv.files as string);
      break;
    case 'assembly':
      await deployAssembly();
      break;
  }
}