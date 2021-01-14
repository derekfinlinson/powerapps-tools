import { authenticate, DeployCredentials } from './powerapps.service';
import path from 'path';
import fs from 'fs';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { logger } from 'just-scripts-utils';
import { WebResource, deploy } from './models/webResource';

export async function deployWebResource(files?: string): Promise<void> {
  const currentPath = '.';
  const configFile = fs.readFileSync(path.resolve(currentPath, 'config.json'), 'utf8');
  const credsFile = fs.readFileSync(path.resolve(currentPath, 'creds.json'), 'utf8');

  if (configFile == null) {
    logger.warn('unable to find config.json file');
    return;
  } else if (credsFile == null) {
    logger.warn('unable to find creds.json file');
    return;
  }

  const config: WebResource[] = JSON.parse(configFile).webResources;
  const creds: DeployCredentials = JSON.parse(credsFile);

  let apiConfig: WebApiConfig;

  try {
    const token = await authenticate(creds);

    apiConfig = new WebApiConfig('8.2', token, creds.server);
  } catch (error) {
    logger.error(`authentication failure: ${error}`);
    return;
  }

  logger.info('deploy web resources');

  try {
    await deploy(config, apiConfig, creds.solution, files);
  } catch (error) {
    logger.error(error.message);
    return;
  }

  logger.info('deployed web resources');
}
