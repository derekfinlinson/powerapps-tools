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

export async function deployType(type: PluginType, assemblyId: string, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  let typeId = await retrieveType(type.typename, assemblyId, apiConfig);

  const record: PluginType = {
    name: type.name,
    friendlyname: type.friendlyname,
    typename: type.typename,
    'pluginassemblyid@odata.bind': type['pluginassemblyid@odata.bind'],
    workflowactivitygroupname: type.workflowactivitygroupname
  };

  if (typeId != '') {
    try {
      await updateType(typeId, record, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update plugin type: ${error.message}`);
    }
  } else {
    try {
      typeId = await createType(record, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to create plugin type: ${error.message}`);
    }
  }

  try {
    if (type.steps) {
      const promises = type.steps.map(async step => {
        step['plugintypeid@odata.bind'] = `/plugintypes(${typeId})`;

        await deployStep(step, typeId, apiConfig, solution);
      });

      await Promise.all(promises);
    }
  } catch (error: any) {
    throw new Error(error.message);
  }

  return typeId;
}

async function retrieveType(name: string, assemblyId: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=plugintypeid&$filter=typename eq '${name}' and _pluginassemblyid_value eq ${assemblyId}`;

  const result = await retrieveMultiple(apiConfig, 'plugintypes', options);

  return result.value.length > 0 ? result.value[0].plugintypeid as string : '';
}

async function createType(type: PluginType, apiConfig: WebApiConfig): Promise<string> {
  logger.info(`create assembly type ${type.name}`);

  const result: any = await createWithReturnData(apiConfig, 'plugintypes', type, '$select=plugintypeid');

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.plugintypeid;
}

async function updateType(id: string, type: PluginType, apiConfig: WebApiConfig) {
  logger.info(`update assembly type ${type.name}`);

  return update(apiConfig, 'plugintypes', id, type);
}
