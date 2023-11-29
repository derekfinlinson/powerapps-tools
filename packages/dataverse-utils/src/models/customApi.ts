import { retrieveMultiple, createWithReturnData, update, WebApiConfig, Entity, QueryOptions } from 'dataverse-webapi/lib/node';
import { retrieveType } from './pluginType';
import { logger } from '../logger';

export interface CustomAPIRequestParameter extends Entity {
  type: number;
  isoptional: boolean;
  displayname: string;
  name: string;
  uniquename: string;
  logicalentityname?: string;
  description: string;
  iscustomizable: { Value: false };
}

export interface CustomAPIResponseProperty extends Entity {
  type: number;
  name: string;
  logicalentityname: string;
  displayname: string;
  uniquename: string;
  description: string;
  iscustomizable: { Value: false };
}

export interface CustomApi extends Entity {
  customapiid?: string;
  allowedcustomprocessingsteptype: number;
  boundentitylogicalname?: string;
  uniquename: string;
  displayname: string;
  bindingtype: number;
  executeprivilegename?: string;
  isfunction: boolean;
  isprivate: boolean;
  description: string;
  iscustomizable: { Value: false };
  name: string;
  plugintype?: string;
  plugintypeid?: string;
  'PluginTypeId@odata.bind'?: string;
  CustomAPIRequestParameters?: CustomAPIRequestParameter[];
  CustomAPIResponseProperties?: CustomAPIResponseProperty[];
}

export async function deployApi(config: CustomApi, assemblyId: string, apiConfig: WebApiConfig, solution: string): Promise<void> {
  const api = structuredClone(config);

  if (!config.customapiid) {
    config.customapiid = await retrieveApi(api.name, apiConfig);
  }

  if (config.plugintype && !config.plugintypeid) {
    config.plugintypeid = await retrieveType(config.plugintype, assemblyId, apiConfig);

    if (config.plugintypeid === '') {
      logger.error(`unable to find plugin type ${api.plugintype}`);
      return;
    }
  }

  delete api.plugintype;
  delete api.customapiid;
  delete api.plugintypeid;

  api['PluginTypeId@odata.bind'] = `plugintypes(${config.plugintypeid})`;

  if (config.customapiid) {
    try {
      await updateApi(config.customapiid, api, apiConfig);
    } catch (error: any) {
      throw new Error(`failed to update custom api: ${error.message}`);
    }
  } else {
    try {
      config.customapiid = await createApi(api, apiConfig, solution);
    } catch (error: any) {
      throw new Error(`failed to create custom api: ${error.message}`);
    }
  }
}

export async function retrieveApi(name: string, apiConfig: WebApiConfig): Promise<string> {
  const options = `$select=customapiid&$filter=name eq '${name}'`;

  const result = await retrieveMultiple(apiConfig, 'customapis', options);

  return result.value.length > 0 ? (result.value[0].customapiid as string) : '';
}

async function createApi(api: CustomApi, apiConfig: WebApiConfig, solution?: string): Promise<string> {
  logger.info(`create custom api ${api.name}`);

  const options: QueryOptions = {};

  if (solution) {
    options.customHeaders = { 'MSCRM.SolutionUniqueName': solution };
  }

  const result: any = await createWithReturnData(apiConfig, 'customapis', api, '$select=customapiid', options);

  if (result?.error) {
    throw new Error(result.error.message);
  }

  return result.customapiid;
}

async function updateApi(id: string, api: CustomApi, apiConfig: WebApiConfig) {
  logger.info(`update custom api ${api.name}`);

  const record = {
    displayname: api.displayname,
    description: api.description,
    name: api.name,
    executeprivilegename: api.executeprivilegename
  };

  if (api.plugintypeid) {
    record['PluginTypeId@odata.bind'] = `plugintypes(${api.plugintypeid})`;
  } else {
    record['PluginTypeId@odata.bind'] = null;
  }

  const result: any = await update(apiConfig, 'customapis', id, record);

  if (result?.error) {
    throw new Error(result.error.message);
  }
}
