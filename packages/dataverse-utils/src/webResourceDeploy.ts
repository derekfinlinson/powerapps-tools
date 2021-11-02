import { DeployCredentials } from './dataverse.service';
import path from 'path';
import fs from 'fs';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { logger } from 'just-scripts-utils';
import { WebResource, deploy } from './models/webResource';

export async function deployWebResource(creds: DeployCredentials, apiConfig: WebApiConfig, files?: string): Promise<void> {
  const currentPath = '.';
  const configFile = fs.readFileSync(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (configFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const config: WebResource[] = JSON.parse(configFile).webResources;

  logger.info('deploy web resources');

  try {
    await deploy(config, apiConfig, creds.solution, files);
  } catch (error: any) {
    logger.error(error.message);
    return;
  }

  logger.info('deployed web resources');
}
