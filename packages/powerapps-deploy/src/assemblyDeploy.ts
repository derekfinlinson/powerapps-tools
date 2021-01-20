import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { PluginAssembly, deploy } from './models/pluginAssembly';
import { DeployCredentials, getToken } from './dataverse.service';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { logger } from 'just-scripts-utils';

export async function deployAssembly(): Promise<void> {
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

  const config: PluginAssembly = JSON.parse(fs.readFileSync(path.resolve(currentPath, 'config.json'), 'utf8'));
  const creds: DeployCredentials = JSON.parse(fs.readFileSync(path.resolve(currentPath, 'creds.json'), 'utf8'));

  let apiConfig: WebApiConfig;

  try {
    const token = await getToken(creds);

    apiConfig = new WebApiConfig('8.2', token, `https://${creds.server}`);
  } catch (error) {
    logger.error(`authentication failure: ${error}`);
    return;
  }

  logger.info('deploy assembly');

  try {
    await deploy(config, apiConfig, creds.solution);
  } catch (error) {
    logger.error(error.message);
    return;
  }

  logger.info(`deployed assembly ${config.name}\r\n`)
}