import https from 'https';
import { spawnSync } from 'child_process';

export const getNugetPackageVersions = (name: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    https.get(`https://azuresearch-usnc.nuget.org/query?q=packageid:${name}`,
      (response) => {
        let body = '';

        response.on('data', (d) => {
          body += d;
        });

        response.on('end', () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const versions = JSON.parse(body).data[0].versions.map((v: any) => {
            return v.version;
          }).reverse();

          resolve(versions);
        });
      }
    ).on('error', (e) => {
      reject(e);
    });
  });
};

export const install = (project: string, sdkVersion: string, xrmVersion: string): void => {
  // Add solution
  spawnSync('dotnet', ['new', 'sln', '-n', project], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  spawnSync('dotnet', ['sln', 'add', `${project}.csproj`], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  // Install nuget packages
  spawnSync('dotnet', ['add', 'package', 'Microsoft.CrmSdk.Workflow', '-v', sdkVersion, '-n'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  spawnSync('dotnet', ['add', 'package', 'JourneyTeam.Xrm', '-v', xrmVersion, '-n'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  if (process.env.JEST_WORKER_ID !== undefined) {
    return;
  }

  spawnSync('dotnet', ['restore'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
};

