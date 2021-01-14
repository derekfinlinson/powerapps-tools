import { logger } from 'just-scripts-utils';
import { retrieveMultiple, createWithReturnData, update, Entity, WebApiConfig } from 'dataverse-webapi/lib/node';

export interface PluginImage extends Entity {
  name: string;
  entityalias: string;
  attributes: string;
  imagetype: number;
  messagepropertyname: string;
  stepId?: string;
  'sdkmessageprocessingstepid@odata.bind'?: string;
}

export async function deployImage(image: PluginImage, apiConfig: WebApiConfig): Promise<string> {
  let imageId = await retrieveImage(image, apiConfig);

  delete image.stepId;

  if (imageId != undefined) {
    try {
      await updateImage(imageId, image, apiConfig);
    } catch (error) {
      throw new Error(`failed to update plugin image: ${error.message}`);
    }
  } else {
    try {
      imageId = await createImage(image, apiConfig);
    } catch (error) {
      throw new Error(`failed to create plugin image: ${error.message}`);
    }
  }

  return imageId;
}

async function retrieveImage(image: PluginImage, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=sdkmessageprocessingstepimageid&$filter=name eq '${image.name}' and _sdkmessageprocessingstepid_value eq ${image.stepId}`;

  const result = await retrieveMultiple(apiConfig, 'sdkmessageprocessingstepimages', options);

  return result.value.length > 0 ? result.value[0].sdkmessageprocessingstepimageid as string : '';
}

async function createImage(image: PluginImage, apiConfig: WebApiConfig): Promise<string> {
  logger.info(`create plugin image ${image.name}`);

  const result = await createWithReturnData(apiConfig, 'sdkmessageprocessingstepimages', image, '$select=sdkmessageprocessingstepimageid');

  return result.sdkmessageprocessingstepimageid as string;
}

async function updateImage(id: string, image: PluginImage, apiConfig: WebApiConfig) {
  logger.info(`update plugin image ${image.name}`);

  return update(apiConfig, 'sdkmessageprocessingstepimages', id, image);
}
