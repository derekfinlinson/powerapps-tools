import https from 'node:https';
import { spawnSync } from 'node:child_process';

export const getNugetPackageVersions = (name: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    https.get(`https://azuresearch-usnc.nuget.org/query?q=packageid:${name}`,
      (response) => {
        let body = '';

        response.on('data', (d) => {
          body += d;
        });

        response.on('end', () => {
          const result = JSON.parse(body);

          if (result.data.length > 0) {
            const versions = result.data[0].versions.map((v: { version: string }) => {
              return v.version;
            }).reverse();

            resolve(versions);
          } else {
            reject(`package ${name} not found`);
          }
        });
      }
    ).on('error', (e) => {
      reject(e);
    });
  });
};

export const nugetRestore = async (): Promise<void> => {
  // Install nuget packages
  if (process.env.JEST_WORKER_ID !== undefined) {
    return;
  }

  spawnSync('dotnet', ['restore'], { cwd: process.cwd(), stdio: 'inherit' });
};
