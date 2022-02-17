import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import * as nuget from './nuget';
import * as pkg from './packageManager';
import { ActionConfig, NodePlopAPI } from 'plop';
import { initialize } from './getEnvInfo';

const didSucceed = (code: number | null) => `${code}` === '0';

interface DataversePlopConfig extends ActionConfig {
  projectType?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (plop: NodePlopAPI): void => {
  void initialize();

  plop.setActionType('signAssembly', (answers: any) => {
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
          reject('failed to sign assembly');
        }
      });

      sign.on('error', () => {
        reject('failed to sign assembly');
      });
    });
  });

  plop.setActionType('runPcf', (answers: any) => {
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

      pac.on('error', () => {
        reject('Ensure the Power Platform CLI is installed. Command must be run from within VS Code if using the Power Platform Extension');
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

  plop.setActionType('nugetInstall', async (answers: any) => {
    const xrmVersions = await nuget.getNugetPackageVersions('JourneyTeam.Xrm');

    const xrmVersion = xrmVersions.shift() as string;

    nuget.install(answers.name, answers.sdkVersion, xrmVersion);

    return 'installed nuget packages';
  });

  plop.setActionType('npmInstall', (_answers, config?: DataversePlopConfig) => {
    if (config?.projectType) {
      pkg.install(process.cwd(), config.projectType);
    }

    return 'installed npm packages';
  });

  const connectionQuestions = [
    {
      type: 'input',
      name: 'server',
      message: 'enter dataverse url (https://org.crm.dynamics.com):'
    },
    {
      type: 'input',
      name: 'tenant',
      message: 'enter azure ad tenant (org.onmicrosoft.com):',
      default: 'common'
    },
    {
      type: 'input',
      name: 'solution',
      message: 'dataverse solution unique name:'
    }
  ];

  plop.setGenerator('webresource', {
    description: 'generate dataverse web resource project',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'project name',
        default: path.basename(process.cwd())
      },
      {
        type: 'input',
        name: 'namespace',
        message: 'namespace for form and ribbon scripts:'
      },
      ...connectionQuestions
    ],
    actions: [
      {
        type: 'addMany',
        templateFiles: ['../plop-templates/webresource/*', '../plop-templates/webresource/.*'],
        base: '../plop-templates/webresource',
        destination: process.cwd(),
        force: true
      },
      {
        type: 'npmInstall',
        projectType: 'webresource',
        skip: (answers) => {
          return !answers.react;
        }
      } as ActionConfig
    ]
  });

  plop.setGenerator('pcf', {
    description: 'generate dataverse pcf project',
    prompts: [
      {
        type: 'list',
        name: 'template',
        message: 'template',
        choices: [
          { name: 'field', value: 'field' },
          { name: 'dataset', value: 'dataset' }
        ]
      },
      {
        type: 'input',
        name: 'namespace',
        message: 'namespace'
      },
      {
        type: 'input',
        name: 'name',
        message: 'name'
      },
      {
        type: 'confirm',
        name: 'react',
        message: 'use react?'
      }
    ],
    actions: [
      {
        type: 'runPcf'
      },
      {
        type: 'addMany',
        templateFiles: [
          '../plop-templates/pcf/App.tsx',
          '../plop-templates/pcf/index.ts.hbs'
        ],
        base: '../plop-templates/pcf',
        destination: `${process.cwd()}/{{ name }}`,
        force: true,
        skip: (answers) => {
          return !answers.react;
        }
      },
      {
        type: 'add',
        templateFile: '../plop-templates/pcf/tsconfig.json',
        path: path.resolve(process.cwd(), 'tsconfig.json'),
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
      },
      {
        type: 'npmInstall',
        projectType: 'pcf',
        skip: (answers) => {
          return !answers.react;
        }
      } as ActionConfig
    ]
  });

  plop.setGenerator('assembly', {
    description: 'generate dataverse assembly project',
    prompts: [
      {
        type: 'list',
        name: 'sdkVersion',
        message: 'select sdk version',
        choices: async () => {
          const versions = await nuget.getNugetPackageVersions('Microsoft.CrmSdk.Workflow');
          return versions.map(v => ({ name: v, value: v }));
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'default C# namespace (Company.Crm.Plugins):'
      },
      {
        type: 'list',
        name: 'isolation',
        message: 'select isolation mode',
        default: 2,
        choices: [
          {
            name: 'sandbox',
            value: 2
          },
          {
            name: 'none',
            value: 1
          }
        ]
      },
      ...connectionQuestions,
    ],
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
      },
      {
        type: 'nugetInstall'
      },
      {
        type: 'npmInstall',
        projectType: 'assembly'
      } as ActionConfig
    ]
  });
}
