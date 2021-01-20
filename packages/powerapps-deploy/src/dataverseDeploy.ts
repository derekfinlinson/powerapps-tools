import yargs from 'yargs';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { logger } from 'just-scripts-utils';
import { deployAssembly } from './assemblyDeploy';
import { deployWebResource } from './webResourceDeploy';
import { DeployCredentials } from './dataverse.service';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { getAccessToken } from './tokenCache';

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

  const currentPath = '.';
  const credsFile = fs.readFileSync(path.resolve(currentPath, 'creds.json'), 'utf8');

  if (credsFile == null) {
    logger.warn('unable to find creds.json file');
    return;
  }

  const creds: DeployCredentials = JSON.parse(credsFile);

  let apiConfig: WebApiConfig;

  try {
    const token = await getAccessToken(creds.server, creds.tenant);

    apiConfig = new WebApiConfig('8.2', token.accessToken, `https://${creds.server}`);
  } catch (error) {
    logger.error(`authentication failure: ${error}`);
    return;
  }
  
  switch (argv.type) {
    case 'webresource':
      await deployWebResource(creds, apiConfig, argv.files as string);
      break;
    case 'assembly':
      await deployAssembly(creds, apiConfig);
      break;
    default:

  }
}