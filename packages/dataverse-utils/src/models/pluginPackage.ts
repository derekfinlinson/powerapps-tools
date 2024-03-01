import fs from 'fs';
import glob from 'glob';
import { createWithReturnData, retrieveMultiple, update, WebApiConfig, Entity, QueryOptions } from 'dataverse-webapi/lib/node';

import { PluginAssembly, retrieveAssembly } from './pluginAssembly';
import { logger } from '../logger';
import { retrieveType } from './pluginType';
import { deployStep } from './pluginStep';

export interface PluginPackage extends Entity {
  pluginpackageid: string;
  name: string;
  prefix: string;
  version: string;
  content?: string;
  assembly?: PluginAssembly;
}

export async function deployPluginPackage(config: PluginPackage, apiConfig: WebApiConfig, solution?: string): Promise<void> {
  const files = glob.sync(`**/${config.name}.*.nupkg`);

  if (files.length === 0) {
    logger.warn(`package ${config.name}.nupkg not found`);
    return;
  }

  const content = (await fs.promises.readFile(files[0])).toString('base64');

  if (!config.pluginpackageid) {
    config.pluginpackageid = await retrievePackage(config.prefix, config.name, apiConfig);
  }

  if (config.pluginpackageid) {
    try {
      await updatePackage(config, content, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update package: ${error.message}`);
    }
  } else {
    try {
      config.pluginpackageid = await createPackage(config, content, apiConfig, solution);
    } catch (error: any) {
      throw new Error(`failed to create package: ${error.message}`);
    }
  }

  if (config.assembly != null) {
    try {
      if (!config.assembly.pluginassemblyid) {
        config.assembly.pluginassemblyid = await retrieveAssembly(config.assembly.name, apiConfig);
      }

      const promises =
        config.assembly.types?.map(async (t) => {
          if (!t.plugintypeid && config.assembly?.pluginassemblyid) {
            t.plugintypeid = await retrieveType(t.typename, config.assembly.pluginassemblyid, apiConfig);
          }

          const stepPromises = t.steps?.map((s) => deployStep(s, t.plugintypeid as string, apiConfig, solution)) ?? [];

          await Promise.all(stepPromises);
        }) ?? [];

      await Promise.all(promises);
    } catch (error: any) {
      logger.error(error.message);
      return;
    }
  }
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

async function updatePackage(config: PluginPackage, content: string, apiConfig: WebApiConfig) {
  logger.info(`update package ${config.name}`);

  const updated = {
    content: content,
    version: config.version
  };

  const result: any = await update(apiConfig, 'pluginpackages', config.pluginpackageid, updated);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
