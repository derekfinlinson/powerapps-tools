import { authenticate, DeployCredentials } from './powerapps.service';
import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { WebApiConfig } from 'xrm-webapi/dist/models';
import { logger } from 'just-scripts-utils';
import { WebResource, deploy } from './models/webResource';

export async function deployWebResource(files?: string): Promise<void> {
  const configFile = glob.sync(`**/config.json`);
  const credsFile = glob.sync('**/creds.json');

  if (configFile.length === 0) {
    logger.warn('unable to find config.json file');
    return;
  } else if (credsFile.length === 0) {
    logger.warn('unable to find creds.json file');
    return;
  }

  const currentPath = path.dirname(configFile[0]);

  const config: WebResource = JSON.parse(fs.readFileSync(path.resolve(currentPath, 'config.json'), 'utf8')).webResources;
  const creds: DeployCredentials = JSON.parse(fs.readFileSync(path.resolve(currentPath, 'creds.json'), 'utf8'));

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
