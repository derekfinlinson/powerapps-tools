import { unboundAction, WebApiConfig } from 'dataverse-webapi/lib/node';
import { getAccessToken } from './tokenCache';

export enum ComponentType {
  WebResource = 61,
  PluginType = 90,
  PluginAssembly = 91,
  SDKMessageProcessingStep = 92,
  SDKMessageProcessingStepImage = 93
}

export interface DeployCredentials {
  server: string;
  tenant?: string;
  solution?: string;
}

export async function getToken(creds: DeployCredentials): Promise<string> {
  const token = await getAccessToken(creds.server, creds.tenant);

  return token.accessToken;
}

export async function addToSolution(id: string, solution: string, type: ComponentType, apiConfig: WebApiConfig): Promise<void> {
  const data = {
    ComponentId: id,
    ComponentType: type,
    SolutionUniqueName: solution,
    AddRequiredComponents: false,
    IncludedComponentSettingsValues: null
  };

  await unboundAction(apiConfig, 'AddSolutionComponent', data);
}

export async function publish(publishXml: string, apiConfig: WebApiConfig): Promise<void> {
  const data = {
    ParameterXml: `<importexportxml><webresources>${publishXml}</webresources></importexportxml>`
  };

  await unboundAction(apiConfig, 'PublishXml', data);
}
