import yargs from 'yargs';
import prompts from 'prompts';

import { logger, prettyPrintMarkdown } from 'just-scripts-utils';

export default async function deploy(argv: yargs.Arguments): Promise<void> {
  if (!argv.type) {
    const { type } = await prompts({
      type: 'select',
      name: 'type',
      message: 'enter project type',
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow Activity', value: 'assembly' }
      ]
    });
  }

  switch (argv.type) {
    case 'webresource':
      await webresource(argv.files as string);
      break;
    case 'assembly':
      await assembly();
      break;
  }
}