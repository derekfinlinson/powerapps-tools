import { ICachePlugin, TokenCacheContext } from '@azure/msal-node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import Cryptr from 'cryptr';

export function cachePlugin(org: string): ICachePlugin {
  const getCachePath = () => {
    if (!fs.existsSync(path.join(os.homedir(), './.dataverse-utils/'))) {
      fs.mkdirSync(path.join(os.homedir(), './.dataverse-utils/'));
    }

    return path.join(os.homedir(), `./.dataverse-utils/${org}.json`);
  };

  const cacheLocation = getCachePath();

  const beforeCacheAccess = (tokenCacheContext: TokenCacheContext): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(cacheLocation)) {
        fs.readFile(cacheLocation, 'utf-8', (err, data) => {
          if (err) {
            reject();
          } else {
            // const crypt = new Cryptr(os.userInfo.name);

            // const decrypted = crypt.decrypt(data.toString());
            tokenCacheContext.tokenCache.deserialize(data);
            resolve();
          }
        });
      } else {
        fs.writeFile(cacheLocation, tokenCacheContext.tokenCache.serialize(), (err) => {
          if (err) {
            reject();
          }
        });
      }
    });
  };

  const afterCacheAccess = (tokenCacheContext: TokenCacheContext): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (tokenCacheContext.cacheHasChanged) {
        // const crypt = new Cryptr(os.userInfo.name);

        // const encrypted = crypt.encrypt(tokenCacheContext.tokenCache.serialize());

        fs.writeFile(cacheLocation, tokenCacheContext.tokenCache.serialize(), (err) => {
          if (err) {
            reject(err);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  return {
    beforeCacheAccess,
    afterCacheAccess
  };
}