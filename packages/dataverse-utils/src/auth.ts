import prompts from 'prompts';
import { cacheExists, cachePlugin, deleteCache } from './cachePlugin.js';
import { AuthenticationResult, PublicClientApplication } from '@azure/msal-node';
import { logger } from './logger.js';
import open from 'open';

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

export const getAccessToken = async (authEndpoint: string, url: string): Promise<AuthenticationResult | null> => {
  const config = {
    auth: {
      clientId: clientId,
      authority: authEndpoint
    },
    cache: {
      cachePlugin: cachePlugin(url)
    }
  };

  const pca = new PublicClientApplication(config);

  const cache = pca.getTokenCache();

  const accounts = await cache?.getAllAccounts().catch((ex) => {
    throw new Error(ex.message);
  });

  // Try to get token silently
  if (accounts.length > 0) {
    try {
      const silentToken = await pca.acquireTokenSilent({
        account: accounts[0],
        scopes: [`${url}/.default`]
      });

      if (silentToken) {
        return silentToken;
      }
    } catch (ex: any) {
      if (ex.message.indexOf('The refresh token has expired due to inactivity') === -1) {
        throw new Error(ex.message);
      }
    }
  }

  // Ask user how they want to sign in
  const { signInMethod } = await prompts({
    type: 'select',
    name: 'signInMethod',
    message: 'Choose a sign-in method',
    initial: 'deviceCode',
    choices: [
      { title: 'Device code', value: 'deviceCode' },
      { title: 'Interactive (opens current browser profile)', value: 'interactive' }
    ]
  });

  let token: AuthenticationResult | null = null;

  // Acquire token
  try {
    if (signInMethod === 'deviceCode') {
      token = await pca.acquireTokenByDeviceCode({
        scopes: [`${url}/.default`],
        deviceCodeCallback: (response) => {
          logger.info(response.message);
        }
      });
    } else {
      token = await pca.acquireTokenInteractive({
        scopes: [`${url}/.default`],
        openBrowser: async (url: string) => {
          open(url);
        }
      });
    }

    return token;
  } catch (ex: any) {
    throw new Error(ex.message);
  }
};
