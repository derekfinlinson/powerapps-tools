import { WebApiConfig } from 'xrm-webapi/dist/models';
import { retrieveMultiple, createWithReturnData, update } from 'xrm-webapi/dist/webapi-node';
import { PluginStep, deployStep } from './pluginStep';
import { logger } from 'just-scripts-utils';

export interface PluginType {
  name: string;
  'pluginassemblyid@odata.bind'?: string;
  typename: string;
  friendlyname: string;
  steps?: PluginStep[];
  workflowactivitygroupname: string;
}

export async function deployType(type: PluginType, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  let typeId = await retrieveType(type.typename, apiConfig);

  const record: PluginType = {
    name: type.name,
    friendlyname: type.friendlyname,
    typename: type.typename,
    'pluginassemblyid@odata.bind': type['pluginassemblyid@odata.bind'],
    workflowactivitygroupname: type.workflowactivitygroupname
  };

  if (typeId != undefined) {
    try {
      await updateType(typeId, record, apiConfig);
    } catch (error) {
      throw new Error(`failed to update plugin type: ${error.message}`);
    }
  } else {
    try {
      typeId = await createType(record, apiConfig);
    } catch (error) {
      throw new Error(`failed to create plugin type: ${error.message}`);
    }
  }

  try {
    if (type.steps) {
      const promises = type.steps.map(async step => {
        step['plugintypeid@odata.bind'] = `/plugintypes(${typeId})`;

        await deployStep(step, apiConfig, solution);
      });

      await Promise.all(promises);
    }
  } catch (error) {
    throw new Error(error.message);
  }

  return typeId;
}

async function retrieveType(name: string, apiConfig: WebApiConfig) {
  const options = `$select=plugintypeid&$filter=typename eq '${name}'`;

  const result = await retrieveMultiple(apiConfig, 'plugintypes', options);

  return result.value.length > 0 ? result.value[0].plugintypeid : undefined;
}

async function createType(type: PluginType, apiConfig: WebApiConfig) {
  logger.info(`create assembly type ${type.name}`);

  const result = await createWithReturnData(apiConfig, 'plugintypes', type, '$select=plugintypeid');

  return result.plugintypeid;
}

async function updateType(id: string, type: PluginType, apiConfig: WebApiConfig) {
  logger.info(`update assembly type ${type.name}`);

  return update(apiConfig, 'plugintypes', id, type);
}
