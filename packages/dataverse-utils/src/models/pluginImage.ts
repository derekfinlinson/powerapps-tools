import { logger } from '../logger';
import { retrieveMultiple, createWithReturnData, update, Entity, WebApiConfig } from 'dataverse-webapi/lib/node';

export interface PluginImage extends Entity {
  name: string;
  entityalias: string;
  attributes: string;
  imagetype: number;
  messagepropertyname: string;
  'sdkmessageprocessingstepid@odata.bind'?: string;
  sdkmessageprocessingstepimageid?: string;
}

export async function deployImage(
  stepId: string,
  stepName: string,
  config: PluginImage,
  message: string | undefined,
  apiConfig: WebApiConfig
): Promise<void> {
  const image = structuredClone(config);

  image['sdkmessageprocessingstepid@odata.bind'] = `/sdkmessageprocessingsteps(${stepId})`;

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

  if (!config.sdkmessageprocessingstepimageid) {
    config.sdkmessageprocessingstepimageid = await retrieveImage(stepId, image, apiConfig);
  }

  if (config.sdkmessageprocessingstepimageid) {
    try {
      await updateImage(config.sdkmessageprocessingstepimageid, image, stepName, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update plugin image: ${error.message}`);
    }
  } else {
    try {
      config.sdkmessageprocessingstepimageid = await createImage(image, stepName, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to create plugin image: ${error.message}`);
    }
  }
}

async function retrieveImage(stepId: string, image: PluginImage, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=sdkmessageprocessingstepimageid&$filter=name eq '${image.name}' and _sdkmessageprocessingstepid_value eq ${stepId}`;

  const result = await retrieveMultiple(apiConfig, 'sdkmessageprocessingstepimages', options);

  return result.value.length > 0 ? (result.value[0].sdkmessageprocessingstepimageid as string) : '';
}

async function createImage(image: PluginImage, stepName: string, apiConfig: WebApiConfig): Promise<string> {
  logger.info(`create plugin image ${image.name} for step ${stepName}`);

  const result: any = await createWithReturnData(
    apiConfig,
    'sdkmessageprocessingstepimages',
    image,
    '$select=sdkmessageprocessingstepimageid'
  );

  if (result?.error) {
    throw new Error(result.error.message);
  }

  return result.sdkmessageprocessingstepimageid;
}

async function updateImage(id: string, image: PluginImage, stepName: string, apiConfig: WebApiConfig) {
  logger.info(`update plugin image ${image.name} for step ${stepName}`);

  const entity = {...image};

  delete entity.sdkmessageprocessingstepimageid;

  const result: any = await update(apiConfig, 'sdkmessageprocessingstepimages', id, entity);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
