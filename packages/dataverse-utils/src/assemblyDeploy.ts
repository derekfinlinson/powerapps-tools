import fs from 'fs';
import path from 'path';

import { deployAssembly } from './models/pluginAssembly';
import { deployPluginPackage } from './models/pluginPackage';
import { deployApi } from './models/customApi';
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

  let assemblyId: string | undefined;

  if (config.assembly) {
    logger.info('deploy plugin package');

    try {
      assemblyId = await deployPluginPackage(config, apiConfig, creds.solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }

    logger.done(`deployed plugin package ${config.prefix}_${config.name}\r\n`);
  } else {
    logger.info('deploy assembly');

    try {
      assemblyId = await deployAssembly(config, apiConfig, creds.solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }

    logger.done(`deployed assembly ${config.name}`);
  }

  if (config.customapis != null && assemblyId) {
    logger.info('deploy custom api');

    try {
      const promises = config.customapis.map((a) => deployApi(a, assemblyId as string, apiConfig, creds.solution));

      await Promise.all(promises);
    } catch (error: any) {
      logger.error(error.message);
    }

    logger.done('deployed custom api');
  }
}
