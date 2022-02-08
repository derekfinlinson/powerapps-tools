import prompts from 'prompts';
import { getNugetPackageVersions, install } from './nuget';
import path from 'path';
import { getGenerator, runGenerator } from './plop';
import * as pkg from './packageManager';
import { initialize } from './getEnvInfo';
import { logger, icons } from './logger';

export interface Config {
  name: string;
  isolation: number,
  tenant: string;
  solution: string;
  server: string;
  xrmVersion?: string;
  sdkVersion?: string;
  react: boolean;
}

export default async (type: string): Promise<void> => {
  await initialize();

  const name = path.basename(process.cwd());

  if (!type || (type !== 'webresource' && type !== 'assembly' && type !== 'pcf')) {
    const invalid = type !== undefined && type !== 'webresource' && type !== 'assembly' && type !== 'pcf';

    const invalidMessage = invalid ? `${type} is not a valid project type.` : '';

    const { promptType } = await prompts({
      type: 'select',
      name: 'promptType',
      message: `${invalidMessage} Select dataverse project to create?`,
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' },
        { title: 'powerapps component framework control', value: 'pcf' }
      ]
    });

    type = promptType;
  }

  const questions = await getAnswers(type as string);
  const config: Config = (await prompts(questions)) as Config;

  if (type === 'assembly') {
    const xrmVersions = await getNugetPackageVersions('JourneyTeam.Xrm');

    config.xrmVersion = xrmVersions.shift();
  }

  logger.info('get plop generator');

  const generator = await getGenerator(type, name);

  logger.info(`run powerapps-project-${type} code generator`);

  await runGenerator(generator, config);

  logger.info('initialize project');

  if (type !== 'pcf' || config.react) {
    pkg.install(process.cwd(), type as string);
  }

  if (type === 'assembly') {
    logger.info('add nuget packages');

    install(config.name, config.sdkVersion, config.xrmVersion);
  }

  done(type);
}

const getAnswers = async (type: string) => {
  let questions: prompts.PromptObject[] = [];

  if (type === 'pcf') {
    questions = [
      {
        type: 'select',
        name: 'template',
        message: 'template',
        choices: [
          { title: 'field', value: 'field' },
          { title: 'dataset', value: 'dataset' }
        ]
      },
      {
        type: 'text',
        name: 'namespace',
        message: 'namespace'
      },
      {
        type: 'text',
        name: 'name',
        message: 'name'
      },
      {
        type: 'confirm',
        name: 'react',
        message: 'install react?'
      }
    ];

    return questions;
  }

  if (type === 'webresource') {
    questions.push({
      type: 'text',
      name: 'namespace',
      message: 'namespace for form and ribbon scripts:'
    });
  } else {
    const versions = await getNugetPackageVersions('Microsoft.CrmSdk.Workflow');

    questions = [
      {
        type: 'select',
        name: 'sdkVersion',
        message: 'select sdk version',
        choices: versions.map(v => ({ title: v, value: v }))
      },
      {
        type: 'text',
        name: 'name',
        message: 'default namespace'
      },
      {
        type: 'select',
        name: 'isolation',
        message: 'select isolation mode',
        initial: 0,
        choices: [
          {
            title: 'sandbox',
            value: 2
          },
          {
            title: 'none',
            value: 1
          }
        ]
      }
    ];
  }

  questions = [
    ...questions,
    {
      type: 'text',
      name: 'server',
      message: 'enter dataverse url (https://org.crm.dynamics.com):'
    },
    {
      type: 'text',
      name: 'tenant',
      message: 'enter azure ad tenant (org.onmicrosoft.com):'
    },
    {
      type: 'text',
      name: 'solution',
      message: 'dataverse solution unique name:'
    }
  ];

  return questions;
};

export const done = (type: string): void => {
  if (process.env.JEST_WORKER_ID !== undefined) {
    return;
  }

  let message: string;

  if (type === 'pcf') {
    message = `

  ${icons.done} ${type} project created!
  
    keep your build tools up-to-date by updating these two devDependencies:
      ${icons.info} powerapps-project-${type}
  
    build your project in watch mode with this command:
      ${icons.info} npm start watch
    build your project in production mode with this command:
      ${icons.info} npm run build
  
    run code generator with this command:
      ${icons.info} npm run gen
  
  `;
  } else {
    message = `

  ${icons.done} ${type} project created!
  
    keep your build tools up-to-date by updating these two devDependencies:
      ${icons.info} dataverse-utils
      ${icons.info} powerapps-project-${type}
  
    ${type === 'webresource' ?
        `build your project in watch mode with this command:
      ${icons.info} ${pkg.getYarn() ? 'yarn' : 'npm run'} start
    build your project in production mode with this command:
      ${icons.info} ${pkg.getYarn() ? 'yarn' : 'npm run'} build
    generate table definition files with this command:
      ${icons.info} ${pkg.getYarn() ? 'yarn' : 'npm run'} generate` :
        `build your project with this command:
        dotnet build
    deploy your project with this command:
      ${icons.info} ${pkg.getYarn() ? 'yarn' : 'npm run'} deploy`}
  
    run code generator with this command:
      ${icons.info} ${pkg.getYarn() ? 'yarn' : 'npm run'} gen
  
  `;
  }

  console.info(message);
}
