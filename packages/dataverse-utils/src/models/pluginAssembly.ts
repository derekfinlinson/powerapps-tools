import fs from 'fs';
import glob from 'node-glob';
import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity } from 'dataverse-webapi/lib/node';

import { PluginType, deployType } from './pluginType';
import { addToSolution, ComponentType } from '../dataverse.service';
import { logger } from 'just-scripts-utils';

export interface PluginAssembly extends Entity {
  name: string;
  content?: string;
  isolationmode?: number;
  version?: string;
  publickeytoken?: string;
  sourcetype?: number;
  culture?: string;
  types?: PluginType[];
}

export async function deploy(config: PluginAssembly, apiConfig: WebApiConfig, solution?: string): Promise<void> {
  const files = glob.sync(`**/${config.name}.dll`);

  if (files.length === 0) {
    logger.error(`assembly ${config.name}.dll not found`);
    return;
  }

  const content = fs.readFileSync(files[0]).toString('base64');

  let assemblyId = '';

  try {
    assemblyId = await retrieveAssembly(config.name, apiConfig);
  } catch (error: any) {
    logger.error(`failed to retrieve assembly ${config.name}: ${error.message}`);
    return;
  }

  if (assemblyId != '') {
    try {
      await updateAssembly(assemblyId, config, content, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update assembly: ${error.message}`);
    }
  } else {
    try {
      assemblyId = await createAssembly(config, content, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to create assembly: ${error.message}`);
    }

    if (solution != undefined) {
      try {
        await addToSolution(assemblyId, solution, ComponentType.PluginAssembly, apiConfig);
      } catch (error: any) {
        logger.error(`failed to add to solution: ${error.message}`);
      }
    }
  }

  if (config.types != null) {
    try {
      const promises = config.types.map(async type => {
        type['pluginassemblyid@odata.bind'] = `/pluginassemblies(${assemblyId})`;

        await deployType(type, apiConfig, solution);
      });

      await Promise.all(promises);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }
  }
}

async function retrieveAssembly(name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=pluginassemblyid&$filter=name eq '${name}'`;

  const result = await retrieveMultiple(apiConfig, 'pluginassemblies', options);

  return result.value.length > 0 ? result.value[0].pluginassemblyid as string : '';
}

async function createAssembly(config: PluginAssembly, content: string, apiConfig: WebApiConfig): Promise<string> {
  logger.info(`create assembly ${config.name}`);

  const assembly: PluginAssembly = {
    name: config.name,
    content: content,
    isolationmode: config.isolationmode,
    version: config.version,
    publickeytoken: config.name,
    sourcetype: 0,
    culture: ''
  };

  const result: any = await createWithReturnData(apiConfig, 'pluginassemblies', assembly, '$select=pluginassemblyid');
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.pluginassemblyid;
}

async function updateAssembly(id: string, config: PluginAssembly, content: string, apiConfig: WebApiConfig) {
  logger.info(`update assembly ${config.name}`);

  const assembly = {
    content: content,
    version: config.version
  };

  return update(apiConfig, 'pluginassemblies', id, assembly);
}
