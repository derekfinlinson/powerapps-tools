import Cryptr from 'cryptr';
import { TokenResponse, AuthenticationContext } from 'adal-node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';

export interface TokenCache {
  [index: string]: string;
}

function getCachePath() {
  return path.join(os.homedir(), '.dataverse-deploy-cache');
}

function getCache(): TokenCache {
  const path = getCachePath();

  if (fs.existsSync(path)) {
    const cache = fs.readFileSync(path);

    return JSON.parse(cache.toString());
  }

  return {};
}

function getTokenWithAuthCode(argEnvUrl: string, redirectUrl: string): Promise<unknown> {
  const authorityHostUrl = 'https://login.windows.net/common';
  const server = argEnvUrl;
  const regex = /(?<=code=)[^&]*/gm;
  const codeMatch = regex.exec(redirectUrl);

  if (!codeMatch) throw new Error('Cannot find code in redirect');

  // eslint-disable-next-line @typescript-eslint/no-this-alias
  return new Promise((resolve, reject) => {
    const context = new AuthenticationContext(authorityHostUrl);

    context.acquireTokenWithAuthorizationCode(
      codeMatch[0],
      'app://58145B91-0C36-4500-8554-080854F2AC97',
      'https://' + server,
      '51f81489-12ee-4a9e-aaae-a2591f45987d',
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
        nodeIntegration: true,
      },
    });

    // Navigate to the get code page
    win.loadURL(
      `${authUrl}?client_id=51f81489-12ee-4a9e-aaae-a2591f45987d&response_type=code&haschrome=1&redirect_uri=app%3A%2F%2F58145B91-0C36-4500-8554-080854F2AC97&scope=openid`,
    );

    win.on('closed', () => {
      if (!loginComplete) {
        reject('Login Closed');
      }
    });

    win.webContents.on('will-redirect', (event, newUrl) => {
      // Check if this is the success callback
      if (newUrl.startsWith('app://58145b91-0c36-4500-8554-080854f2ac97')) {
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

export function addTokenToCache(url: string, token: TokenResponse): void {
  const cache = getCache();

  const tokenJson = JSON.stringify(token);

  const crypt = new Cryptr(os.userInfo.name);

  const encrypted = crypt.encrypt(tokenJson);

  cache[url] = encrypted;

  fs.writeFileSync(getCachePath(), JSON.stringify(cache));
}

export function getTokenFromCache(url: string): TokenResponse {
  const cache = getCache();

  const encrypted = cache[url];

  if (!encrypted) {
    return {} as TokenResponse;
  }

  const crypt = new Cryptr(os.userInfo.name);

  const decrypted = crypt.decrypt(encrypted);

  return JSON.parse(decrypted);
}

export async function getAccessToken(url: string, tenant = 'common'): Promise<TokenResponse> {
  return new Promise<TokenResponse>((resolve, reject) => {
    const token = getTokenFromCache(url);

    const context = new AuthenticationContext('https://login.windows.net/common');
    const server = 'https://' + url;
    const clientId = '51f81489-12ee-4a9e-aaae-a2591f45987d';

    if (!token.expiresOn) {
      // Get initial token
      authenticate(url, tenant).then(authToken => {
        addTokenToCache(url, authToken);
        resolve(authToken);
      });
    } else {
      const expiryDate = new Date(Date.parse(token.expiresOn.toString()));
      const nowDate = new Date();
      const expiresInMinutes = (((expiryDate as unknown) as number) - ((nowDate as unknown) as number)) / 1000 / 60;
      const hasTokenExpired = expiresInMinutes < 5;

      if (hasTokenExpired) {
        // Get new token using refresh token
        context.acquireTokenWithRefreshToken(token.refreshToken as string, clientId, server, (err, tokenResponse) => {
          if (err) {
            reject(err);
          } else {
            const newToken = tokenResponse as TokenResponse;
            addTokenToCache(url, newToken);
            resolve(newToken);
          }
        });
      } else {
        // Use current token
        resolve(token);
      }
    }
  });
}
