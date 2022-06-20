import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import * as nuget from './nuget';
import * as pkg from './packageManager';
import { NodePlopAPI } from 'plop';

const didSucceed = (code: number | null) => `${code}` === '0';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require('../package').version;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default (plop: NodePlopAPI): void => {
  plop.setWelcomeMessage(`Creating new Dataverse project using create-powerapps-project v${version}. Please choose type of project to create.`);

  const packageQuestion = {
    type: 'list',
    name: 'package',
    message: 'package manager (ensure selected option is installed)',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'pnpm', value: 'pnpm' },
      { name: 'yarn', value: 'yarn' }
    ],
    default: 'npm'
  };

  const sharedQuestions = [
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

  plop.setActionType('addScript', async (answers: any) => {
    const packagePath = path.resolve(process.cwd(), 'package.json');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(packagePath);

    packageJson.scripts[answers.scriptKey] = answers.scriptValue;

    await fs.promises.writeFile(packagePath, JSON.stringify(packageJson, null, 4), 'utf8');

    return `added ${answers.scriptKey} script to package.json`;
  });

  plop.setActionType('npmInstall', (answers: any) => {
    pkg.install(process.cwd(), answers.projectType, answers.package);

    return 'installed npm packages';
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
        message: 'default C# namespace (Company.Crm.Plugins):',
        validate: (name: string) => {
          const namespace = name.split('.');

          if (namespace.length !== 3) {
            return `enter namespace using 'Company.Crm.Plugins' convention`;
          }

          for (const item of namespace) {
            const title = plop.renderString('{{titleCase name}}', { name: item});

            if  (title !== item) {
              return `enter namespace using pascal case (Company.Crm.Plugins)`;
            }
          }

          return true;
        }
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
      packageQuestion,
      ...sharedQuestions,
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
      (answers: any) => {
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
      },
      async (answers: any) => {
        const xrmVersions = await nuget.getNugetPackageVersions('JourneyTeam.Xrm');

        const xrmVersion = xrmVersions.shift() as string;

        nuget.install(answers.name, answers.sdkVersion, xrmVersion);

        return 'installed nuget packages';
      },
      {
        type: 'npmInstall',
        data: {
          projectType: 'assembly'
        }
      }
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
      },
      packageQuestion
    ],
    actions: [
      (answers: any) => {
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
      },
      {
        type: 'add',
        templateFile: '../plop-templates/pcf/tsconfig.json',
        path: path.resolve(process.cwd(), 'tsconfig.json'),
        force: true
      },
      {
        type: 'addMany',
        templateFiles: [
          '../plop-templates/pcf/App.tsx.hbs',
          '../plop-templates/pcf/AppContext.ts'
        ],
        base: '../plop-templates/pcf',
        destination: `${process.cwd()}/{{ name }}`,
        skip: (answers) => {
          if (!answers.react) {
            return 'react not included';
          }

          return;
        }
      },
      {
        type: 'modify',
        path: `${process.cwd()}/{{ name }}/index.ts`,
        pattern: 'import { HelloWorld, IHelloWorldProps } from "./HelloWorld";',
        template: `import { App, IAppProps } from './App';`
      },
      {
        type: 'modify',
        path: `${process.cwd()}/{{ name }}/index.ts`,
        pattern: 'HelloWorld, props',
        template: 'App, props'
      },
      {
        type: 'modify',
        path: `${process.cwd()}/{{ name }}/index.ts`,
        pattern: `const props: IHelloWorldProps = { name: 'Hello, World!' };`,
        template: `const props: IAppProps = { context: context };`
      },
      {
        type: 'addScript',
        data: {
          scriptKey: 'build:prod',
          scriptValue: 'pcf-scripts build --buildMode production'
        }
      },
      async (answers: any) => {
        await fs.promises.rm(path.resolve(process.cwd(), answers.name, 'HelloWorld.tsx'));

        return 'removed HelloWorld component';
      },
      {
        type: 'npmInstall',
        data: {
          projectType: 'pcf'
        },
        skip: (answers) => {
          if (answers.package === 'npm') {
            return 'npm packages already installed';
          }
        }
      }
    ]
  });

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
      packageQuestion,
      ...sharedQuestions
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
        data: {
          projectType: 'webresource'
        }
      }
    ]
  });
}
