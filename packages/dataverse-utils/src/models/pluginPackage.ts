import fs from 'fs';
import glob from 'glob';
import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity, QueryOptions } from 'dataverse-webapi/lib/node';

import { PluginAssembly, deployAssembly } from './pluginAssembly';
import { logger } from '../logger';

export interface PluginPackage extends Entity {
  name: string;
  prefix: string;
  version: string;
  content?: string;
  assembly?: PluginAssembly;
}

export async function deployPluginPackage(config: PluginPackage, apiConfig: WebApiConfig, solution?: string): Promise<string | undefined> {
  const files = glob.sync(`**/${config.name}.*.nupkg`);

  if (files.length === 0) {
    logger.warn(`package ${config.name}.nupkg not found`);
    return;
  }

  const content = (await fs.promises.readFile(files[0])).toString('base64');

  let packageId = '';

  try {
    packageId = await retrievePackage(config.prefix, config.name, apiConfig);
  } catch (error: any) {
    logger.error(`failed to retrieve package ${config.name}: ${error.message}`);
    return;
  }

  if (packageId != '') {
    try {
      await updatePackage(packageId, config, content, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update package: ${error.message}`);
    }
  } else {
    try {
      packageId = await createPackage(config, content, apiConfig, solution);
    } catch (error: any) {
      throw new Error(`failed to create package: ${error.message}`);
    }
  }

  let assemblyId: string | undefined;

  if (config.assembly != null) {
    try {
      config.assembly['packageid@odata.bind'] = `/pluginpackages(${packageId})`;

      assemblyId = await deployAssembly(config.assembly, apiConfig, solution);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }
  }

  return assemblyId;
}

async function retrievePackage(prefix: string, name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=pluginpackageid&$filter=contains(name, '${prefix}_${name}')`;

  const result = await retrieveMultiple(apiConfig, 'pluginpackages', options);

  return result.value.length > 0 ? (result.value[0].pluginpackageid as string) : '';
}

async function createPackage(config: PluginPackage, content: string, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  logger.info(`create package ${config.name}`);

  const pluginPackage = {
    name: `${config.prefix}_${config.name}`,
    version: config.version,
    content: content
  };

  const options: QueryOptions = {};

  if (solution) {
    options.customHeaders = { 'MSCRM.SolutionUniqueName': solution };
  }

  const result: any = await createWithReturnData(apiConfig, 'pluginpackages', pluginPackage, '$select=pluginpackageid', options);

  if (result?.error) {
    throw new Error(result.error.message);
  }

  return result.pluginpackageid;
}

async function updatePackage(id: string, config: PluginPackage, content: string, apiConfig: WebApiConfig) {
  logger.info(`update package ${config.name}`);

  const updated = {
    content: content,
    version: config.version
  };

  const result: any = await update(apiConfig, 'pluginpackages', id, updated);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
