import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity, QueryOptions } from 'dataverse-webapi/lib/node';
import { logger } from '../logger.js';
import { deployImage, PluginImage } from './pluginImage.js';

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
  asyncautodelete?: boolean;
  'plugintypeid@odata.bind'?: string;
  'sdkmessagefilterid@odata.bind'?: string;
  'sdkmessageid@odata.bind'?: string;
  filteringattributes?: string;
  sdkmessageprocessingstepid?: string;
}

export async function deployStep(config: PluginStep, pluginTypeId: string, apiConfig: WebApiConfig, solution?: string): Promise<void> {
  const step = structuredClone(config);

  step['plugintypeid@odata.bind'] = `/plugintypes(${pluginTypeId})`;

  const messageId = await getSdkMessageId(step.message ?? '', apiConfig);

  if (messageId == '') {
    logger.warn(`sdk message ${step.message} not found`);
    return;
  }

  if (step.entity !== '' && step.entity !== 'none') {
    const filterId = await getSdkMessageFilterId(messageId, step.entity ?? '', apiConfig);

    if (filterId == '') {
      logger.warn(`sdk message ${step.message} for entity ${step.entity} not found`);
      return;
    }

    step['sdkmessagefilterid@odata.bind'] = `/sdkmessagefilters(${filterId})`;
  }

  step['sdkmessageid@odata.bind'] = `/sdkmessages(${messageId})`;

  step.asyncautodelete = step.mode === 1;

  delete step.images;
  delete step.message;
  delete step.entity;
  delete step.sdkmessageprocessingstepid;

  if (!config.sdkmessageprocessingstepid) {
    config.sdkmessageprocessingstepid = await retrieveStep(step.name, pluginTypeId, apiConfig);
  }

  if (config.sdkmessageprocessingstepid !== '') {
    try {
      await updateStep(config.sdkmessageprocessingstepid, step, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update plugin step: ${error.message}`);
    }
  } else {
    try {
      config.sdkmessageprocessingstepid = await createStep(step, apiConfig, solution);
    } catch (error: any) {
      throw new Error(`failed to create plugin step: ${error.message}`);
    }
  }

  if (config.images && config.images.length > 0) {
    try {
      const promises = config.images.map((image) =>
        deployImage(config.sdkmessageprocessingstepid as string, step.name, image, config.message, apiConfig)
      );

      await Promise.all(promises);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

async function getSdkMessageFilterId(messageId: string, entityName: string, apiConfig: WebApiConfig) {
  const options = [
    `?$filter=primaryobjecttypecode eq '${entityName}' and _sdkmessageid_value eq ${messageId}`,
    '&$select=sdkmessagefilterid'
  ].join('');

  const message = await retrieveMultiple(apiConfig, 'sdkmessagefilters', options);

  return message.value.length > 0 ? message.value[0].sdkmessagefilterid : '';
}

async function getSdkMessageId(name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = [`?$filter=name eq '${name}'`, '&$select=sdkmessageid'].join('');

  const message = await retrieveMultiple(apiConfig, 'sdkmessages', options);

  return message.value.length > 0 ? (message.value[0].sdkmessageid as string) : '';
}

async function retrieveStep(name: string, typeId: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=sdkmessageprocessingstepid&$filter=name eq '${name}' and _plugintypeid_value eq ${typeId}`;

  const result = await retrieveMultiple(apiConfig, 'sdkmessageprocessingsteps', options);

  return result.value.length > 0 ? (result.value[0].sdkmessageprocessingstepid as string) : '';
}

async function createStep(step: PluginStep, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  logger.info(`create plugin step ${step.name}`);

  const options: QueryOptions = {};

  if (solution) {
    options.customHeaders = { 'MSCRM.SolutionUniqueName': solution };
  }

  const result: any = await createWithReturnData(
    apiConfig,
    'sdkmessageprocessingsteps',
    step,
    '$select=sdkmessageprocessingstepid',
    options
  );

  if (result?.error) {
    throw new Error(result.error.message);
  }

  return result.sdkmessageprocessingstepid;
}

async function updateStep(id: string, step: PluginStep, apiConfig: WebApiConfig) {
  logger.info(`update plugin step ${step.name}`);

  const entity = { ...step };

  delete entity.sdkmessageprocessingstepid;

  const result: any = await update(apiConfig, 'sdkmessageprocessingsteps', id, entity);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
