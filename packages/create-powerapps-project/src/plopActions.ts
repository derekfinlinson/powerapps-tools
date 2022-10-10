import path from 'path';
import { spawnSync, spawn } from 'child_process';
import fs from 'fs';
import * as nuget from './nuget';
import * as pkg from './packageManager';
import { NodePlopAPI } from 'plop';

const didSucceed = (code: number | null) => `${code}` === '0';

export default (plop: NodePlopAPI): void => {
  plop.setDefaultInclude({ actionTypes: true });

  plop.setActionType('addSolution', async (answers: any) => {
    // Add solution
    spawnSync('dotnet', ['new', 'sln', '-n', answers.name], { cwd: process.cwd(), stdio: 'inherit' });

    spawnSync('dotnet', ['sln', 'add', `${answers.name}.csproj`], { cwd: process.cwd(), stdio: 'inherit' });

    return 'added dotnet solution';
  });

  plop.setActionType('addScript', async (answers: any) => {
    const packagePath = path.resolve(process.cwd(), 'package.json');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(packagePath);

    packageJson.scripts[answers.scriptKey] = answers.scriptValue;

    answers.scriptValue = plop.renderString(answers.scriptValue, answers);

    await fs.promises.writeFile(packagePath, JSON.stringify(packageJson, null, 4), 'utf8');

    return `added ${answers.scriptKey} script to package.json`;
  });

  plop.setActionType('npmInstall', async (answers: any) => {
    await pkg.install(answers.package, answers.packages);

    return 'installed npm packages';
  });

  plop.setActionType('nugetRestore', async () => {
    await nuget.nugetRestore();

    return 'restored nuget packages';
  });

  plop.setActionType('signAssembly', async (answers: any) => {
    const keyPath = path.resolve(process.cwd(), `${answers.name}.snk`);

    return new Promise((resolve, reject) => {
      if (process.env.JEST_WORKER_ID !== undefined) {
        resolve('Testing so no need to sign');
      } else {
        const sign = spawn(path.resolve(__dirname, '..', 'bin', 'sn.exe'), ['-q', '-k', keyPath], { stdio: 'inherit' });

        sign.on('close', (code) => {
          if (didSucceed(code)) {
            resolve('signed assembly');
          } else {
            reject('failed to sign assembly');
          }
        });

        sign.on('error', () => {
          reject('failed to sign assembly');
        });
      }
    });
  });

  plop.setActionType('runPcf', async (answers: any) => {
    const args = ['pcf', 'init', '-ns', answers.namespace, '-n', answers.name, '-t', answers.template];

    // Set framework to React if selected
    if (answers.react) {
      args.push('-fw', 'react');
    }

    if (process.env.JEST_WORKER_ID !== undefined || answers.package !== 'npm') {
      args.push('-npm', 'false');
    } else {
      args.push('-npm', 'true');
    }

    return new Promise((resolve, reject) => {
      const pac = spawn('pac', args, { stdio: 'inherit' });

      pac.on('close', (code) => {
        if (didSucceed(code)) {
          resolve('pcf project created');
        } else {
          reject('Ensure the Power Platform CLI is installed. Command must be run from within Visual Studio Code if using the Power Platform Extension');
        }
      });

      pac.on('error', () => {
        reject('Ensure the Power Platform CLI is installed. Command must be run from within Visual Studio Code if using the Power Platform Extension');
      });
    });
  });
}