import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity } from 'dataverse-webapi/lib/node';
import { PluginStep, deployStep } from './pluginStep';
import { logger } from '../logger';

export interface PluginType extends Entity {
  name: string;
  'pluginassemblyid@odata.bind'?: string;
  typename: string;
  friendlyname: string;
  steps?: PluginStep[];
  workflowactivitygroupname: string;
}

export async function deployType(config: PluginType, assemblyId: string, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  let typeId = await retrieveType(config.typename, assemblyId, apiConfig);

  const type: PluginType = {
    name: config.name,
    friendlyname: config.friendlyname,
    typename: config.typename,
    'pluginassemblyid@odata.bind': config['pluginassemblyid@odata.bind'],
    workflowactivitygroupname: config.workflowactivitygroupname
  };

  if (typeId != '') {
    try {
      await updateType(typeId, type, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update plugin type: ${error.message}`);
    }
  } else {
    try {
      typeId = await createType(type, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to create plugin type: ${error.message}`);
    }
  }

  try {
    if (config.steps) {
      const promises = config.steps.map((step) => {
        step['plugintypeid@odata.bind'] = `/plugintypes(${typeId})`;

        return deployStep(step, typeId, apiConfig, solution);
      });

      await Promise.all(promises);
    }
  } catch (error: any) {
    throw new Error(error.message);
  }

  return typeId;
}

export async function retrieveType(name: string, assemblyId: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=plugintypeid&$filter=typename eq '${name}' and _pluginassemblyid_value eq ${assemblyId}`;

  const result = await retrieveMultiple(apiConfig, 'plugintypes', options);

  return result.value.length > 0 ? (result.value[0].plugintypeid as string) : '';
}

async function createType(type: PluginType, apiConfig: WebApiConfig): Promise<string> {
  logger.info(`create assembly type ${type.name}`);

  const result: any = await createWithReturnData(apiConfig, 'plugintypes', type, '$select=plugintypeid');

  if (result?.error) {
    throw new Error(result.error.message);
  }

  return result.plugintypeid;
}

async function updateType(id: string, type: PluginType, apiConfig: WebApiConfig) {
  logger.info(`update assembly type ${type.name}`);

  const result: any = await update(apiConfig, 'plugintypes', id, type);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
