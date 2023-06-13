import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { assemblyDeploy } from './assemblyDeploy';
import { webResourceDeploy } from './webResourceDeploy';
import { DeployCredentials } from './dataverse.service';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { AuthenticationResult } from '@azure/msal-node';
import { getAccessToken, onTokenFailure } from './auth';

export default async function deploy(type?: string, files?: string): Promise<void> {
  if (!type || (type !== 'webresource' && type !== 'assembly' && type !== 'pcf')) {
    const invalid = type !== undefined && type !== 'webresource' && type !== 'assembly' && type !== 'pcf';

    const invalidMessage = invalid ? `${type} is not a valid project type. ` : '';

    const { typePrompt } = await prompts({
      type: 'select',
      name: 'typePrompt',
      message: `${invalidMessage}select project type to deploy`,
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'pcf', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' }
      ]
    });

    type = typePrompt;
  }

  const currentPath = '.';
  const credsFile = await fs.promises.readFile(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (credsFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const creds: DeployCredentials = JSON.parse(credsFile).connection;

  let token: AuthenticationResult | null = null;

  try {
    token = await getAccessToken(creds.tenant, creds.server);
  } catch (error: any) {
    onTokenFailure(creds.server, error.message);

    return;
  }

  if (token == null || token.accessToken == null) {
    onTokenFailure(creds.server);

    return;
  }

  const apiConfig = new WebApiConfig('8.2', token.accessToken, creds.server);

  switch (type) {
    case 'webresource':
      await webResourceDeploy(creds, apiConfig, files as string);
      break;
    case 'assembly':
      await assemblyDeploy(creds, apiConfig);
      break;
    case 'pcf':
      logger.error('PCF deploy coming soon');
      break;
    default:
      break;
  }
}
