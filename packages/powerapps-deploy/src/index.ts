#!/usr/bin/env node
import { AuthenticationContext, TokenResponse } from 'adal-node';
import { app, BrowserWindow } from 'electron';
import { addTokenToCache, getTokenFromCache } from './tokenCache';
import fs from 'fs';
import path from 'path';
import { DeployCredentials } from './dataverse.service';
import { logger } from 'just-scripts-utils';

const clientId = '51f81489-12ee-4a9e-aaae-a2591f45987d';
const authorityHostUrl = 'https://login.windows.net/common';
const redirect = 'app://58145B91-0C36-4500-8554-080854F2AC97';

function getTokenWithAuthCode(url: string, redirectUrl: string): Promise<unknown> {
  const regex = /(?<=code=)[^&]*/gm;
  const authCode = regex.exec(redirectUrl);

  if (!authCode) {
    throw new Error('Auth code not found in redirect');
  }

  return new Promise((resolve, reject) => {
    const context = new AuthenticationContext(authorityHostUrl);

    context.acquireTokenWithAuthorizationCode(
      authCode[0],
      redirect,
      url,
      clientId,
      '',
      (err, tokenResponse) => {
        if (err) {
          reject(err);
        } else {
          resolve(tokenResponse);
        }
      },
    );
  });
}

async function authenticate(url: string, tenant: string): Promise<TokenResponse> {
  app.allowRendererProcessReuse = true;

  const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;

  await app.whenReady();

  return new Promise((resolve, reject) => {
    let loginComplete = false;

    // Create the browser window.
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      webPreferences: {
        contextIsolation: true
      },
    });

    // Navigate to the get code page
    win.loadURL(
      `${authUrl}?client_id=${clientId}&response_type=code&haschrome=1&redirect_uri=${encodeURIComponent(redirect)}&scope=openid`,
    );

    win.on('closed', () => {
      if (!loginComplete) {
        reject('Login Closed');
      }
    });

    win.webContents.on('will-redirect', (event, newUrl) => {
      // Check if this is the success callback
      if (newUrl.toLowerCase().startsWith(redirect.toLowerCase())) {
        // Stop the redirect to the app: endpoint
        event.preventDefault();
        loginComplete = true;

        getTokenWithAuthCode(url, newUrl).then(
          (tokenResponse) => {
            const token = tokenResponse as TokenResponse;
            win.close();
            resolve(token);
          },
          (err) => {
            console.log('Token Acquisition failed:' + JSON.stringify(err));
            reject(err);
          },
        );
      }
    });
  });
}

export default async function getAccessToken(): Promise<void> {
  const currentPath = '.';
  const credsFile = fs.readFileSync(path.resolve(currentPath, 'creds.json'), 'utf8');

  if (credsFile == null) {
    throw new Error('unable to find creds.json file');
  }

  const creds: DeployCredentials = JSON.parse(credsFile);

  return new Promise<void>((resolve, reject) => {
    const token = getTokenFromCache(creds.server);

    if (!token.expiresOn) {
      // Get initial token
      authenticate(creds.server, creds.tenant).then(authToken => {
        addTokenToCache(creds.server, authToken);
        resolve();
      });
    } else {
      const expiryDate = new Date(Date.parse(token.expiresOn.toString()));
      const nowDate = new Date();
      const expiresInMinutes = (((expiryDate as unknown) as number) - ((nowDate as unknown) as number)) / 1000 / 60;
      const hasTokenExpired = expiresInMinutes < 5;

      if (hasTokenExpired) {
        const context = new AuthenticationContext(authorityHostUrl);

        // Get new token using refresh token
        context.acquireTokenWithRefreshToken(token.refreshToken as string, clientId, creds.server, (err, tokenResponse) => {
          if (err) {
            reject(err);
          } else {
            const newToken = tokenResponse as TokenResponse;
            addTokenToCache(creds.server, newToken);
            resolve();
          }
        });
      } else {
        // Use current token
        resolve();
      }
    }
  });
}

async function main() {
  try {
    await getAccessToken();
    app.exit();
  } catch (ex) {
    logger.error(ex);
  }
}

main();
