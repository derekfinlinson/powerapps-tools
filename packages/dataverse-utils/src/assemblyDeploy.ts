import fs from 'fs';
import path from 'path';

import { deployAssembly } from './models/pluginAssembly.js';
import { deployPluginPackage } from './models/pluginPackage.js';
import { deployApi } from './models/customApi.js';
import { DeployCredentials } from './dataverse.service.js';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { logger } from './logger.js';

export async function assemblyDeploy(creds: DeployCredentials, apiConfig: WebApiConfig): Promise<void> {
  const currentPath = '.';
  const configFile = await fs.promises.readFile(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (configFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const config = JSON.parse(configFile);

  if (config.assembly) {
    logger.info('deploy plugin package');

    try {
      await deployPluginPackage(config, apiConfig, creds.solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }

    logger.done(`deployed plugin package ${config.prefix}_${config.name}\r\n`);
  } else {
    logger.info(`deploy assembly to ${creds.server}`);

    try {
      await deployAssembly(config, apiConfig, creds.solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }

    logger.done(`deployed assembly ${config.name}`);
  }

  if (config.customapis?.length > 0 && (config.pluginassemblyid || config.assembly?.pluginassemblyid)) {
    logger.info('deploy custom api');

    const assemblyId = config.pluginassemblyid ?? config.assembly.pluginassemblyid;

    try {
      const promises = config.customapis.map((a) => deployApi(a, assemblyId, apiConfig, creds.solution));

      await Promise.all(promises);
    } catch (error: any) {
      logger.error(error.message);
    }

    logger.done('deployed custom api');
  }

  await fs.promises.writeFile(path.resolve(currentPath, 'dataverse.config.json'), JSON.stringify(config, null, 4), 'utf8');
}
