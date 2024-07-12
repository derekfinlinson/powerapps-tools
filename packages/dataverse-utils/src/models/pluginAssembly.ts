/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import { glob } from 'glob';
import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity, QueryOptions } from 'dataverse-webapi/lib/node';

import { PluginType, deployType } from './pluginType';
import { logger } from '../logger';

export interface PluginAssembly extends Entity {
  pluginassemblyid: string;
  name: string;
  'packageid@odata.bind'?: string;
  content?: string;
  isolationmode?: number;
  version?: string;
  publickeytoken?: string;
  sourcetype?: number;
  culture?: string;
  types?: PluginType[];
}

export async function deployAssembly(config: PluginAssembly, apiConfig: WebApiConfig, solution?: string): Promise<void> {
  const files = await glob(`bin/Debug/**/${config.name}.dll`);

  if (files.length === 0) {
    logger.warn(`assembly ${config.name}.dll not found`);
    return;
  }

  const content = (await fs.promises.readFile(files[0])).toString('base64');

  if (!config.pluginassemblyid) {
    config.pluginassemblyid = await retrieveAssembly(config.name, apiConfig);
  }

  if (config.pluginassemblyid) {
    try {
      await updateAssembly(config, content, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update assembly: ${error.message}`);
    }
  } else {
    try {
      config.pluginassemblyid = await createAssembly(config, content, apiConfig, solution);
    } catch (error: any) {
      throw new Error(`failed to create assembly: ${error.message}`);
    }
  }

  if (config.types != null) {
    try {
      const promises = config.types.map((type) => deployType(type, config.pluginassemblyid, apiConfig, solution));

      await Promise.all(promises);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }
  }
}

export async function retrieveAssembly(name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=pluginassemblyid&$filter=name eq '${name}'`;

  const result = await retrieveMultiple(apiConfig, 'pluginassemblies', options);

  return result.value.length > 0 ? (result.value[0].pluginassemblyid as string) : '';
}

async function createAssembly(config: PluginAssembly, content: string, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  logger.info(`create assembly ${config.name}`);

  const assembly = {
    name: config.name,
    content: content,
    isolationmode: config.isolationmode,
    version: config.version,
    publickeytoken: config.name,
    sourcetype: 0,
    culture: ''
  };

  const options: QueryOptions = {};

  if (solution) {
    options.customHeaders = { 'MSCRM.SolutionUniqueName': solution };
  }

  const result: any = await createWithReturnData(apiConfig, 'pluginassemblies', assembly, '$select=pluginassemblyid', options);

  if (result?.error) {
    throw new Error(result.error.message);
  }

  return result.pluginassemblyid;
}

async function updateAssembly(config: PluginAssembly, content: string, apiConfig: WebApiConfig) {
  logger.info(`update assembly ${config.name}`);

  const assembly = {
    content: content,
    version: config.version
  };

  const result: any = await update(apiConfig, 'pluginassemblies', config.pluginassemblyid, assembly);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
