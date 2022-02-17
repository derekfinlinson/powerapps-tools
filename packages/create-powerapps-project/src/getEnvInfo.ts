/* eslint-disable @typescript-eslint/no-explicit-any */
import envinfo from 'envinfo';
import os from 'os';
import path from 'path';

export interface EnvInfoCache {
  Binaries: { Yarn: any, npm: any },
}

let envInfoCache: EnvInfoCache;

export const getEnvInfo = (): EnvInfoCache => {
  return envInfoCache;
};

export const initialize = async (): Promise<void> => {
  envInfoCache = JSON.parse(
    await envinfo.run(
      {
        Binaries: ['Yarn', 'npm']
      },
      { json: true, showNotFound: false }
    )
  ) as EnvInfoCache;

  if (envInfoCache.Binaries.Yarn) {
    envInfoCache.Binaries.Yarn.path = expandHome(envInfoCache.Binaries.Yarn.path);
  }

  if (envInfoCache.Binaries.npm) {
    envInfoCache.Binaries.npm.path = expandHome(envInfoCache.Binaries.npm.path);
  }
};

const expandHome = (pathString: string) => {
  if (pathString.startsWith('~' + path.sep)) {
    return pathString.replace('~', os.homedir());
  }

  return pathString;
}
