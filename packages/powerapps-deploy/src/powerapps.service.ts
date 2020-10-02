import { AuthenticationContext, TokenResponse } from 'adal-node';
import { unboundAction } from 'xrm-webapi/dist/webapi-node';
import { WebApiConfig } from 'xrm-webapi/dist/models';

export enum ComponentType {
  WebResource = 61,
  PluginType = 90,
  PluginAssembly = 91,
  SDKMessageProcessingStep = 92,
  SDKMessageProcessingStepImage = 93
}

export interface DeployCredentials {
  clientId?: string;
  clientSecret?: string;
  server: string;
  tenant?: string;
  username?: string;
  password?: string;
  solution?: string;
}

export function authenticate(creds: DeployCredentials): Promise<string> {
  return new Promise((resolve, reject) => {
    // authenticate
    const tenant = creds.tenant || 'common';
    const context = new AuthenticationContext(`https://login.microsoftonline.com/${tenant}`);
    const clientId: string = creds.clientId || 'c67c746f-9745-46eb-83bb-5742263736b7';

    // use client id/secret auth
    if (creds.clientSecret != null && creds.clientSecret !== "") {
      context.acquireTokenWithClientCredentials(creds.server, clientId, creds.clientSecret,
        (ex, token) => {
          if (ex) {
            reject(ex);
          } else {
            resolve((token as TokenResponse).accessToken);
          }
        }
      );
      // username/password authentication
    } else {
      if (creds.username && creds.password) {
        context.acquireTokenWithUsernamePassword(creds.server, creds.username, creds.password, clientId,
          (ex, token) => {
            if (ex) {
              reject(ex);
            } else {
              resolve((token as TokenResponse).accessToken);
            }
          }
        );
      }
    }
  });
}

export async function addToSolution(id: string, solution: string, type: ComponentType, apiConfig: WebApiConfig) {
  const data: any = {
    ComponentId: id,
    ComponentType: type,
    SolutionUniqueName: solution,
    AddRequiredComponents: false,
    IncludedComponentSettingsValues: null
  };

  await unboundAction(apiConfig, 'AddSolutionComponent', data);
}

export async function publish(publishXml: string, apiConfig: WebApiConfig) {
  const data: any = {
    ParameterXml: `<importexportxml><webresources>${publishXml}</webresources></importexportxml>`
  };

  await unboundAction(apiConfig, 'PublishXml', data);
}
