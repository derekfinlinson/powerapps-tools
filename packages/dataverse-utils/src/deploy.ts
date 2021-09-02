import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { logger } from 'just-scripts-utils';
import { deployAssembly } from './assemblyDeploy';
import { deployWebResource } from './webResourceDeploy';
import { DeployCredentials } from './dataverse.service';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { getTokenFromCache } from './tokenCache';

export default async function deploy(type?: string, files?: string): Promise<void> {
  if (!type || (type !== 'webresource' && type !== 'assembly')) {
    const invalid = type !== undefined && type !== 'webresource' && type !== 'assembly';

    const invalidMessage = invalid ? `${type} is not a valid project type.` : '';

    const { typePrompt } = await prompts({
      type: 'select',
      name: 'typePrompt',
      message: `${invalidMessage} Select project type to deploy`,
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' }
      ]
    });

    type = typePrompt;
  }

  const currentPath = '.';
  const credsFile = fs.readFileSync(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (credsFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const creds: DeployCredentials = JSON.parse(credsFile).connection;

  const token = getTokenFromCache(creds.server);

  if (!token.accessToken) {
    logger.error('use dataverse-utils auth command to get access token before deploying');
    return;
  }

  const apiConfig = new WebApiConfig('8.2', token.accessToken, creds.server);

  switch (type) {
    case 'webresource':
      await deployWebResource(creds, apiConfig, files as string);
      break;
    case 'assembly':
      await deployAssembly(creds, apiConfig);
      break;
    default:
      break;
  }
}