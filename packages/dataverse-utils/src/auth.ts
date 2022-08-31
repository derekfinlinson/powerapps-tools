import prompts from 'prompts';
import { cacheExists, cachePlugin, deleteCache } from './cachePlugin';
import { AuthenticationResult, PublicClientApplication } from '@azure/msal-node';
import { logger } from './logger';

const clientId = '51f81489-12ee-4a9e-aaae-a2591f45987d';

export const onTokenFailure = async (url: string, error?: string): Promise<void> => {
  if (error) {
    logger.error(`failed to acquire access token: ${error}`);
  } else {
    logger.error('failed to acquire access token');
  }

  if (cacheExists(url)) {
    const { deleteToken } = await prompts({
      type: 'confirm',
      name: 'deleteToken',
      message: `delete current token cache for ${url}?`
    });

    if (deleteToken) {
      deleteCache(url);
    }
  }
};

export const getAccessToken = async (tenant: string, url: string): Promise<AuthenticationResult | null> => {
  const config = {
    auth: {
      clientId: clientId,
      authority: `https://login.microsoftonline.com/${tenant}/`
    },
    cache: {
      cachePlugin: cachePlugin(url)
    }
  };

  const pca = new PublicClientApplication(config);

  const cache = pca.getTokenCache();

  const accounts = await cache?.getAllAccounts().catch(ex => {
    throw new Error(ex.message);
  });

  // Try to get token silently
  if (accounts.length > 0) {
    const silentToken = await pca.acquireTokenSilent({
      account: accounts[0],
      scopes: [`${url}/.default`]
    }).catch(ex => {
      throw new Error(ex.message);
    });

    if (silentToken) {
      return silentToken;
    }
  }

  // Acquire token by device code
  const token = await pca.acquireTokenByDeviceCode({
    scopes: [`${url}/.default`],
    deviceCodeCallback: (response) => logger.info(response.message)
  }).catch(ex => {
    throw new Error(ex.message);
  });

  return token;
};
