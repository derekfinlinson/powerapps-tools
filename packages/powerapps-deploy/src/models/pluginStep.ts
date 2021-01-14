import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity } from 'dataverse-webapi/lib/node';
import { addToSolution, ComponentType } from '../powerapps.service';
import { logger } from 'just-scripts-utils';
import { deployImage, PluginImage } from './pluginImage';

export interface PluginStep extends Entity {
  name: string;
  configuration: number;
  description?: string;
  mode: number;
  rank: number;
  stage: number;
  images?: PluginImage[];
  supporteddeployment: number;
  message?: string;
  entity?: string;
  'plugintypeid@odata.bind'?: string;
  'sdkmessagefilterid@odata.bind'?: string;
  'sdkmessageid@odata.bind'?: string;
  filteringattributes?: string;
}

export async function deployStep(step: PluginStep, apiConfig: WebApiConfig, solution?: string): Promise<string | undefined> {
  let stepId = await retrieveStep(step.name, apiConfig);
  const messageId = await getSdkMessageId(step.message ?? '', apiConfig);

  if (messageId == undefined) {
    logger.error(`sdk message ${step.message} not found`);
    return;
  }

  const filterId = await getSdkMessageFilterId(messageId, step.entity ?? '', apiConfig);

  if (filterId == undefined) {
    logger.error(`sdk message ${step.message} for entity ${step.entity} not found`);
    return;
  }

  step['sdkmessagefilterid@odata.bind'] = `/sdkmessagefilters(${filterId})`;
  step['sdkmessageid@odata.bind'] = `/sdkmessages(${messageId})`;

  const images = step.images;
  const message = step.message;

  delete step.images;
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
        throw new Error(`failed to add to solution: ${error.message}`);
      }
    }
  }

  try {
    if (images) {
      const promises = images.map(async image => {
        image['sdkmessageprocessingstepid@odata.bind'] = `/sdkmessageprocessingsteps(${stepId})`;
        image.stepId = stepId;

        switch (message) {
          case 'Create':
            image.messagepropertyname = 'Id';
            break;
          case 'SetState':
          case 'SetStateDynamicEntity':
            image.messagepropertyname = 'EntityMoniker';
            break;
          case 'Send':
          case 'DeliverIncoming':
          case 'DeliverPromote':
            image.messagepropertyname = 'EmailId';
            break;
          default:
            image.messagepropertyname = 'Target';
            break;
        }

        await deployImage(image, apiConfig);
      });

      await Promise.all(promises);
    }
  } catch (error) {
    throw new Error(error.message);
  }

  return stepId;
}

async function retrieveStep(name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=sdkmessageprocessingstepid&$filter=name eq '${name}'`;

  const result = await retrieveMultiple(apiConfig, 'sdkmessageprocessingsteps', options);

  return result.value.length > 0 ? result.value[0].sdkmessageprocessingstepid as string : '';
}

async function getSdkMessageFilterId(messageId: string, entityName: string, apiConfig: WebApiConfig) {
  const options = [
    `?$filter=primaryobjecttypecode eq '${entityName}' and _sdkmessageid_value eq ${messageId}`,
    '&$select=sdkmessagefilterid'
  ].join('');

  const message = await retrieveMultiple(apiConfig, 'sdkmessagefilters', options);

  return message.value[0].sdkmessagefilterid;
}

async function getSdkMessageId(name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = [
    `?$filter=name eq '${name}'`,
    '&$select=sdkmessageid'
  ].join('');

  const message = await retrieveMultiple(apiConfig, 'sdkmessages', options);

  return message.value[0].sdkmessageid as string;
}

async function createStep(step: PluginStep, apiConfig: WebApiConfig): Promise<string> {
  logger.info(`create plugin step ${step.name}`);

  const result = await createWithReturnData(apiConfig, 'sdkmessageprocessingsteps', step, '$select=sdkmessageprocessingstepid');

  return result.sdkmessageprocessingstepid as string;
}

async function updateStep(id: string, step: PluginStep, apiConfig: WebApiConfig) {
  logger.info(`update plugin step ${step.name}`);

  return update(apiConfig, 'sdkmessageprocessingsteps', id, step);
}
