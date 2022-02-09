import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const didSucceed = (code: number | null) => `${code}` === '0';

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (plop: any): void => {
  plop.setActionType('signAssembly', (answers) => {
    const keyPath = path.resolve(process.cwd(), `${answers.name}.snk`);

    return new Promise((resolve, reject) => {
      if (process.env.JEST_WORKER_ID !== undefined) {
        resolve('Testing so no need to sign');
      }

      const sign = spawn(path.resolve(__dirname, '../', 'bin', 'sn.exe'), ['-q', '-k', keyPath], { stdio: 'inherit' });

      sign.on('close', (code) => {
        if (didSucceed(code)) {
          resolve('signed assembly');
        } else {
          reject('Failed to sign assembly');
        }
      });
    });
  });

  plop.setActionType('runPcf', (answers) => {
    const args = ['pcf', 'init', '-ns', answers.namespace, '-n', answers.name, '-t', answers.template];

    /// Setting framework to React currently unsupported by PCF CLI
    // if (answers.react) {
    //   args.push('-fw', 'react');
    // }

    if (process.env.JEST_WORKER_ID !== undefined) {
      args.push('-npm', 'false');
    }

    return new Promise((resolve, reject) => {
      const pac = spawn('pac', args, { stdio: 'inherit' });

      pac.on('close', (code) => {
        if (didSucceed(code)) {
          resolve('pcf project created');
        } else {
          reject('Ensure the Power Platform CLI is installed. Command must be run from within VS Code if using the Power Platform Extension');
        }
      });
    });
  });

  plop.setActionType('addGenScript', async () => {
    const packagePath = path.resolve(process.cwd(), 'package.json');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(packagePath);

    packageJson.scripts.gen = 'plop';

    await fs.promises.writeFile(packagePath, JSON.stringify(packageJson, null, 4), 'utf8');

    return 'added plop script to package.json';
  });

  plop.setGenerator('webresource', {
    actions: [
      {
        type: 'addMany',
        templateFiles: ['../plop-templates/webresource/*', '../plop-templates/webresource/.*'],
        base: '../plop-templates/webresource',
        destination: process.cwd(),
        force: true
      }
    ]
  });

  plop.setGenerator('pcf', {
    actions: [
      {
        type: 'runPcf'
      },
      {
        type: 'addMany',
        templateFiles: [
          '../plop-templates/pcf/App.tsx',
          '../plop-templates/pcf/index.ts'
        ],
        base: '../plop-templates/pcf',
        destination: `${process.cwd()}/{{ name }}`,
        force: true,
        skip: (answers) => {
          return !answers.react;
        }
      },
      {
        type: 'addGenScript',
        skip: (answers) => {
          return !answers.react;
        }
      }
    ]
  });

  plop.setGenerator('assembly', {
    actions: [
      {
        type: 'add',
        templateFile: '../plop-templates/assembly/assembly.csproj.hbs',
        path: path.resolve(process.cwd(), '{{name}}.csproj'),
      },
      {
        type: 'addMany',
        templateFiles: [
          '../plop-templates/assembly/*.json.hbs',
          '../plop-templates/assembly/*.js',
          '../plop-templates/assembly/*.ts.hbs',
          '../plop-templates/assembly/.gitignore',
          '../plop-templates/assembly/Entities/EarlyBoundGenerator.xml',
          '../plop-templates/assembly/.vscode/tasks.json',
          '../plop-templates/assembly/.editorconfig'
        ],
        base: '../plop-templates/assembly',
        destination: process.cwd(),
        force: true
      },
      {
        type: 'signAssembly'
      }
    ]
  });
}
