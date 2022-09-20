import fs from 'fs';
import path from 'path';
import { deployAssembly } from './models/pluginAssembly';
import { deployPluginPackage } from './models/pluginPackage';
import { DeployCredentials } from './dataverse.service';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { logger } from './logger';

export async function assemblyDeploy(creds: DeployCredentials, apiConfig: WebApiConfig): Promise<void> {
  const currentPath = '.';
  const configFile = await fs.promises.readFile(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (configFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const config = JSON.parse(configFile);

  if (config.prefix) {
    logger.info('deploy plugin package');

    try {
      await deployPluginPackage(config, apiConfig, creds.solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }

    logger.done(`deployed plugin package ${config.prefix}_${config.name}\r\n`);
  } else {
    logger.info('deploy assembly');

    try {
      await deployAssembly(config, apiConfig, creds.solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }

    logger.done(`deployed assembly ${config.name}\r\n`);
  }
}