import { WebApiConfig } from 'xrm-webapi/dist/models';
import { retrieveMultiple, createWithReturnData, update } from 'xrm-webapi/dist/webapi-node';
import { addToSolution, ComponentType } from '../powerapps.service';
import { logger } from 'just-scripts-utils';

export interface PluginStep {
  name: string;
  configuration: number;
  description?: string;
  mode: number;
  rank: number;
  stage: number;
  supporteddeployment: number;
  message: string;
  entity: string;
  'plugintypeid@odata.bind'?: string;
  'sdkmessagefilterid@odata.bind'?: string;
  'sdkmessageid@odata.bind'?: string;
  filteringattributes?: string;
}

export async function deployStep(step: PluginStep, solution: string, apiConfig: WebApiConfig): Promise<string | undefined> {
  let stepId = await retrieveStep(step.name, apiConfig);
  const messageId = await getSdkMessageId(step.message, apiConfig);

  if (messageId == undefined) {
    logger.error(`sdk message ${step.message} not found`);
    return;
  }

  const filterId = await getSdkMessageFilterId(messageId, step.entity, apiConfig);

  if (filterId == undefined) {
    logger.error(`sdk message ${step.message} for entity ${step.entity} not found`);
    return;
  }
  
  step['sdkmessagefilterid@odata.bind'] = `/sdkmessagefilters(${filterId})`;
  step['sdkmessageid@odata.bind'] = `/sdkmessages(${messageId})`;

  delete step.message;
  delete step.entity;

  if (stepId != undefined) {
    try {
      await updateStep(stepId, step, apiConfig);
    } catch (error) {
      throw new Error(`failed to update plugin step: ${error.message}`);
    }
  } else {
    try {
      stepId = await createStep(step, apiConfig);
    } catch (error) {
      throw new Error(`failed to create plugin step: ${error.message}`);
    }

    if (solution != undefined) {
      try {
        await addToSolution(stepId, solution, ComponentType.SDKMessageProcessingStep, apiConfig);
      } catch (error) {
        console.error(`failed to add to solution: ${error.message}`);
      }
    }
  }

  return stepId;
}

async function retrieveStep(name: string, apiConfig: WebApiConfig) {
  const options = `$select=sdkmessageprocessingstepid&$filter=name eq '${name}'`;

  const result = await retrieveMultiple(apiConfig, 'sdkmessageprocessingsteps', options);

  return result.value.length > 0 ? result.value[0].sdkmessageprocessingstepid : undefined;
}

async function getSdkMessageFilterId(messageId: string, entityName: string, apiConfig: WebApiConfig) {
  const options = [
    `?$filter=primaryobjecttypecode eq '${entityName}' and _sdkmessageid_value eq ${messageId}`,
    '&$select=sdkmessagefilterid'
  ].join('');

  const message = await retrieveMultiple(apiConfig, 'sdkmessagefilters', options);

  return message.value[0].sdkmessagefilterid;
}

async function getSdkMessageId(name: string, apiConfig: WebApiConfig) {
  const options = [
    `?$filter=name eq '${name}'`,
    '&$select=sdkmessageid'
  ].join('');

  const message = await retrieveMultiple(apiConfig, 'sdkmessages', options);

  return message.value[0].sdkmessageid;
}

async function createStep(step: PluginStep, apiConfig: WebApiConfig) {
  console.log(`create plugin step ${step.name}`);

  const result = await createWithReturnData(apiConfig, 'sdkmessageprocessingsteps', step, '$select=sdkmessageprocessingstepid');

  return result.sdkmessageprocessingstepid;
}

async function updateStep(id: string, step: PluginStep, apiConfig: WebApiConfig) {
  console.log(`update plugin step ${step.name}`);

  return update(apiConfig, 'sdkmessageprocessingsteps', id, step);
}
