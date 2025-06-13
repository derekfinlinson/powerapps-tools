import path from 'node:path';
import fs from 'node:fs';
import { NodePlopAPI } from 'plop';
import { getNugetPackageVersions } from './nuget.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async (plop: NodePlopAPI): Promise<void> => {
  plop.setWelcomeMessage('Creating new Dataverse project using create-powerapps-project. Please choose type of project to create.');

  await plop.load('./plopActions');

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
      message: 'enter dataverse url (https://org.crm.dynamics.com):',
      validate: (answer: string) => {
        try {
          const url = new URL(answer);

          if (url.protocol !== 'https:') {
            return 'server should begin with https';
          }

          return true;
        } catch (ex) {
          return 'enter a valid URL';
        }
      }
    },
    {
      type: 'input',
      name: 'authEndpoint',
      message: 'enter azure authorization endpoint:',
      default: 'https://login.microsoftonline.com/common'
    },
    {
      type: 'input',
      name: 'solution',
      message: 'dataverse solution unique name:'
    }
  ];

  plop.setGenerator('assembly', {
    description: 'generate dataverse plugin or workflow activity project',
    prompts: [
      {
        type: 'confirm',
        name: 'pluginPackage',
        message: 'use plugin package for dependent assemblies (recommended)?'
      },
      {
        type: 'input',
        name: 'prefix',
        message: 'publisher prefix (no underscore):',
        validate: (answer: string) => {
          if (answer.slice(-1) === '_') {
            return 'enter publisher prefix without the underscore';
          }

          return true;
        },
        when: (answers) => answers.pluginPackage
      },
      {
        type: 'input',
        name: 'author',
        message: 'package author:',
        when: (answers) => answers.pluginPackage
      },
      {
        type: 'input',
        name: 'company',
        message: 'package company:',
        when: (answers) => answers.pluginPackage
      },
      {
        type: 'list',
        name: 'sdkVersion',
        message: (answers) => {
          const crmPackage = answers.pluginPackage ? 'Microsoft.CrmSdk.CoreAssemblies' : 'Microsoft.CrmSdk.Workflow';

          return `select ${crmPackage} version`;
        },
        choices: async (answers) => {
          const crmPackage = answers.pluginPackage ? 'Microsoft.CrmSdk.CoreAssemblies' : 'Microsoft.CrmSdk.Workflow';
          const versions = await getNugetPackageVersions(crmPackage);

          return versions;
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'default C# namespace (Company.Crm.Plugins):',
        validate: (answer: string) => {
          if (answer === '') {
            return 'namespace is required';
          }

          const validNamespace = answer.replace(/[^a-zA-Z.]+/g, '');

          if (validNamespace !== answer) {
            return 'namespace must contain only alpha characters and periods';
          }

          const namespace = answer.split('.');

          for (const item of namespace) {
            const title = plop.renderString('{{pascalCase name}}', { name: item });

            if (title !== item) {
              return `enter namespace using PascalCase`;
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
      ...sharedQuestions
    ],
    actions: (data: any) => {
      data.org = new URL(data.server).hostname.split('.')[0];

      return [
        async (answers: any) => {
          const xrmVersions = await getNugetPackageVersions('JourneyTeam.Xrm');

          answers.xrmVersion = xrmVersions.shift();

          return `retrieved latest JourneyTeam.Xrm version ${answers.xrmVersion}`;
        },
        {
          type: 'add',
          templateFile: '../plop-templates/assembly/assembly.csproj.hbs',
          path: path.resolve(process.cwd(), '{{name}}.csproj'),
          skip: (answers) => {
            if (answers.pluginPackage) {
              return 'generating plugin package';
            } else {
              return;
            }
          }
        },
        {
          type: 'add',
          templateFile: '../plop-templates/assembly/package.csproj.hbs',
          path: path.resolve(process.cwd(), '{{name}}.csproj'),
          skip: (answers) => {
            if (!answers.pluginPackage) {
              return 'generating regular assembly';
            } else {
              return;
            }
          }
        },
        {
          type: 'add',
          templateFile: '../plop-templates/assembly/dataverse.config.json.hbs',
          path: path.resolve(process.cwd(), 'dataverse.config.json'),
          skip: (answers) => {
            if (answers.pluginPackage) {
              return 'generating plugin package';
            } else {
              return;
            }
          }
        },
        {
          type: 'add',
          templateFile: '../plop-templates/assembly/dataverse.package.config.json.hbs',
          path: path.resolve(process.cwd(), 'dataverse.config.json'),
          skip: (answers) => {
            if (!answers.pluginPackage) {
              return 'generating regular assembly';
            } else {
              return;
            }
          }
        },
        {
          type: 'addMany',
          templateFiles: [
            '../plop-templates/assembly/package.json.hbs',
            '../plop-templates/assembly/plopfile.js',
            '../plop-templates/assembly/.gitignore',
            '../plop-templates/assembly/.gitattributes',
            '../plop-templates/assembly/builderSettings.json.hbs',
            '../plop-templates/assembly/.vscode/tasks.json.hbs',
            '../plop-templates/assembly/.editorconfig'
          ],
          base: '../plop-templates/assembly',
          destination: process.cwd(),
          force: true
        },
        {
          type: 'addSolution'
        },
        {
          type: 'signAssembly',
          skip: (answers) => {
            if (answers.pluginPackage) {
              return `plugin packages don't need to be signed`;
            } else {
              return;
            }
          }
        },
        {
          type: 'nugetRestore'
        },
        {
          type: 'npmInstall',
          data: {
            packages: {
              devDependencies: ['powerapps-project-assembly', 'dataverse-utils']
            }
          }
        }
      ];
    }
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
        type: 'input',
        name: 'prefix',
        message: 'publisher prefix'
      },
      {
        type: 'input',
        name: 'server',
        message: 'enter dataverse url (https://org.crm.dynamics.com):',
        validate: (answer: string) => {
          try {
            const url = new URL(answer);

            if (url.protocol !== 'https:') {
              return 'server should begin with https';
            }

            return true;
          } catch (ex) {
            return 'enter a valid URL';
          }
        }
      },
      {
        type: 'confirm',
        name: 'react',
        message: 'use react?'
      },
      {
        type: 'list',
        name: 'fluentVersion',
        message: 'select Fluent UI version',
        choices: [
          { name: 'v8', value: 8 },
          { name: 'v9', value: 9 }
        ],
        when: (answers) => answers.react
      },
      packageQuestion
    ],
    actions: (data: any) => {
      data.org = new URL(data.server).hostname.split('.')[0];

      return [
        {
          type: 'runPcf'
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/tsconfig.json',
          path: path.resolve(process.cwd(), 'tsconfig.json'),
          force: true
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/plopfile.js',
          path: path.resolve(process.cwd(), 'plopfile.js'),
          force: true
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/.eslintrc.json',
          path: path.resolve(process.cwd(), '.eslintrc.json'),
          force: true
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/.gitattributes',
          path: path.resolve(process.cwd(), '.gitattributes'),
          force: true
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/App.tsx',
          path: path.resolve(process.cwd(), '{{name}}', 'App.tsx'),
          skip: (answers) => {
            if (!answers.react) {
              return 'react not included';
            }

            if (answers.fluentVersion === 9) {
              return 'using fluent v9';
            }

            return;
          }
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/AppFluent9.tsx.hbs',
          path: path.resolve(process.cwd(), '{{name}}', 'App.tsx'),
          skip: (answers) => {
            if (!answers.react) {
              return 'react not included';
            }

            if (answers.fluentVersion === 8) {
              return 'using fluent v8';
            }

            return;
          }
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/AppContext.tsx',
          path: path.resolve(process.cwd(), '{{name}}', 'contexts', 'AppContext.tsx'),
          skip: (answers) => {
            if (!answers.react) {
              return 'react not included';
            }

            return;
          }
        },
        {
          type: 'add',
          templateFile: '../plop-templates/pcf/index.ts.hbs',
          path: path.resolve(process.cwd(), '{{name}}', 'index.ts'),
          force: true,
          skip: (answers) => {
            if (!answers.react || answers.fluentVersion === 8) {
              return 'not using Fluent UI v9';
            }

            return;
          }
        },
        {
          type: 'modify',
          path: `${process.cwd()}/{{name}}/index.ts`,
          pattern: 'import { HelloWorld, IHelloWorldProps } from "./HelloWorld";',
          template: `import { App } from './App';`
        },
        {
          type: 'modify',
          path: `${process.cwd()}/{{name}}/index.ts`,
          pattern: 'HelloWorld, props',
          template: 'App, { context: context }'
        },
        {
          type: 'modify',
          path: `${process.cwd()}/{{name}}/index.ts`,
          pattern: `const props: IHelloWorldProps = { name: 'Hello, World!' };`,
          template: ''
        },
        {
          type: 'addScript',
          data: {
            scriptKey: 'authenticate',
            scriptValue: `pac auth create -n ${data.org} -dc`
          }
        },
        {
          type: 'addScript',
          data: {
            scriptKey: 'select-auth',
            scriptValue: `pac auth select -n ${data.org}`
          }
        },
        {
          type: 'addScript',
          data: {
            scriptKey: 'push',
            scriptValue: `npm run select-auth && pac pcf version -s manifest && pac pcf push -pp ${data.prefix} -env ${data.server}`
          }
        },
        {
          type: 'addScript',
          data: {
            scriptKey: 'push-inc',
            scriptValue: `npm run build && npm run select-auth && pac pcf version -s manifest && pac pcf push -pp ${data.prefix} -inc -env ${data.server}`
          }
        },
        {
          type: 'addScript',
          data: {
            scriptKey: 'preinstall',
            scriptValue: `npx only-allow ${data.package}`
          }
        },
        async (answers: any) => {
          if (answers.react && answers.fluentVersion === 8) {
            await fs.promises.rm(path.resolve(process.cwd(), answers.name, 'HelloWorld.tsx'));

            return 'removed HelloWorld component';
          }

          return 'react not included';
        },
        {
          type: 'npmInstall'
        },
        {
          type: 'npmInstall',
          data: {
            packages: {
              devDependencies: [
                'powerapps-project-pcf',
                '@types/react@^16',
                '@types/react-dom@^16',
                'eslint-plugin-react-hooks',
                '@types/xrm'
              ],
              dependencies: ['@fluentui/react-hooks']
            }
          },
          skip: (answers) => {
            if (!answers.react) {
              return 'react not included';
            }

            if (answers.fluentVersion === 9) {
              return 'using fluent v9';
            }

            return;
          }
        },
        {
          type: 'npmInstall',
          data: {
            packages: {
              devDependencies: [
                'powerapps-project-pcf',
                '@types/react@^17',
                '@types/react-dom@^17',
                'eslint-plugin-react-hooks',
                '@types/xrm',
                'eslint-plugin-react'
              ],
              dependencies: ['@fluentui/react-hooks', '@fluentui/react-components', '@fluentui/react-icons', 'react@^17', 'react-dom@^17']
            }
          },
          skip: (answers) => {
            if (!answers.react) {
              return 'react not included';
            }

            if (answers.fluentVersion === 8) {
              return 'using fluent v8';
            }

            return;
          }
        }
      ];
    }
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
      ...sharedQuestions,
      {
        type: 'confirm',
        name: 'deploy',
        message: 'deploy via Azure DevOps Pipelines?'
      }
    ],
    actions: (data: any) => {
      return [
        {
          type: 'addMany',
          templateFiles: [
            '../plop-templates/webresource/*',
            '../plop-templates/webresource/.*',
            '../plop-templates/webresource/.gitignore',
            '../plop-templates/webresource/.gitattributes',
            '../plop-templates/webresource/.eslintignore',
            '../plop-templates/webresource/.prettierignore'
          ],
          base: '../plop-templates/webresource',
          destination: process.cwd(),
          force: true
        },
        {
          type: 'addMany',
          templateFiles: ['../plop-templates/webresource-deploy/.*'],
          base: '../plop-templates/webresource',
          destination: process.cwd(),
          force: true,
          skip: (answers) => {
            if (!answers.deploy) {
              return 'deployment files not included';
            }

            return;
          }
        },
        {
          type: 'npmInstall',
          data: {
            packages: {
              devDependencies: [
                'powerapps-project-webresource',
                'dataverse-utils',
                '@types/xrm',
                'typescript',
                'eslint',
                'prettier',
                'eslint-config-prettier',
                '@typescript-eslint/eslint-plugin',
                '@typescript-eslint/parser',
                'webpack-event-plugin',
                'clean-webpack-plugin',
                'xrm-mock',
                'webpack',
                'webpack-cli',
                'cross-spawn',
                'esbuild-loader',
                'ts-loader',
                '@microsoft/eslint-plugin-power-apps',
                '-D'
              ],
              dependencies: ['powerapps-common', 'dataverse-webapi']
            }
          }
        }
      ];
    }
  });
};
