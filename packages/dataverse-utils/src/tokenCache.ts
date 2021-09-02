import Cryptr from 'cryptr';
import { TokenResponse } from 'adal-node';
import os from 'os';
import path from 'path';
import fs from 'fs';

export interface TokenCache {
  [index: string]: string;
}

function getCachePath() {
  return path.join(os.homedir(), '.dataverse-deploy');
}

function getCache(): TokenCache {
  const path = getCachePath();

  if (fs.existsSync(path)) {
    const cache = fs.readFileSync(path);

    const crypt = new Cryptr(os.userInfo.name);

    const decrypted = crypt.decrypt(cache.toString());

    return JSON.parse(decrypted);
  }

  return {};
}

export function addTokenToCache(url: string, token: TokenResponse): void {
  const cache = getCache();

  cache[url] = JSON.stringify(token);

  const crypt = new Cryptr(os.userInfo.name);

  const encrypted = crypt.encrypt(JSON.stringify(cache));

  fs.writeFileSync(getCachePath(), encrypted);
}

export function getTokenFromCache(url: string): TokenResponse {
  const cache = getCache();

  const urlToken = cache[url];

  if (!urlToken) {
    return {} as TokenResponse;
  }

  return JSON.parse(urlToken);
}
