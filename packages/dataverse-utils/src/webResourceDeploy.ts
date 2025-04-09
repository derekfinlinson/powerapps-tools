import { DeployCredentials } from './dataverse.service.js';
import path from 'path';
import fs from 'fs';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { logger } from './logger.js';
import { WebResource, deploy } from './models/webResource.js';

export async function webResourceDeploy(creds: DeployCredentials, apiConfig: WebApiConfig, files?: string): Promise<void> {
  const currentPath = '.';
  const configFile = await fs.promises.readFile(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (configFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const config: any = JSON.parse(configFile);

  const resources: WebResource[] = config.webResources;

  logger.info('deploy web resources');

  try {
    await deploy(resources, apiConfig, creds.solution, files);
  } catch (error: any) {
    logger.error(error.message);
    return;
  }

  logger.done('deployed web resources');

  await fs.promises.writeFile(path.resolve(currentPath, 'dataverse.config.json'), JSON.stringify(config, null, 4), 'utf8');
}
