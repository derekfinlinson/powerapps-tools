import yargs from 'yargs';
import prompts from 'prompts';
import { getNugetPackageVersions } from './nuget';
import path from 'path';
import { getGenerator, runGenerator } from './plop';
import * as pkg from './packageManager';
import { logger, prettyPrintMarkdown } from 'just-scripts-utils';
import { initialize } from './getEnvInfo';

export interface Config {
  name: string;
  isolation: number,
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  solution: string;
  server: string;
  authType: string;
  xrmVersion?: string;
  sdkVersion?: string;
}

export default async function create(argv: yargs.Arguments): Promise<void> {
  await initialize();

  argv.name = path.basename(process.cwd());

  if (!argv.type || (argv.type !== 'webresource' && argv.type !== 'assembly')) {
    const invalid = argv.type !== 'webresource' && argv.type !== 'assembly';

    const invalidMessage = invalid ? `${argv.type} is not valid project type. ` : '';

    const { type } = await prompts({
      type: 'select',
      name: 'type',
      message: `${invalidMessage} What type of powerapps project to create?`,
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' }
      ]
    });

    argv.type = type;

    logger.warn(`${argv.type} is not a valid project type`);
    return;
  }

  const questions = await getAnswers(argv.type as string);
  const config: Config = (await prompts(questions)) as Config;

  if (argv.type === 'assembly') {
    const xrmVersion = await getNugetPackageVersions('JourneyTeam.Xrm');

    config.xrmVersion = xrmVersion.pop();
  }

  logger.info('Get plop generator');

  const generator = getGenerator(argv);

  logger.info(`Run powerapps-project-${argv.type} code generator`);

  await runGenerator(generator, config);

  logger.info('Initialize project');

  pkg.install(process.cwd(), argv.type);

  done(argv);
}

async function getAnswers(type: string) {
  let questions: prompts.PromptObject[] = [];

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
        message: 'select D365 SDK Version',
        choices: versions.map(v => ({ title: v, value: v }))
      },
      {
        type: 'text',
        name: 'name',
        message: 'default namespace',
        initial: path.basename(process.cwd())
      },
      {
        type: 'select',
        name: 'isolation',
        message: 'select isolation mode',
        initial: 2,
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
      message: 'enter powerapps url (https://org.crm.dynamics.com):'
    },
    {
      type: 'select',
      name: 'authType',
      message: 'select authentication method:',
      choices: [
        {
          title: 'username/password',
          value: 'user'
        },
        {
          title: 'client id/client secret',
          value: 'client'
        }
      ]
    },
    {
      type: (prev, values) => values.authType === 'user' ? 'text' : null,
      name: 'username',
      message: 'enter powerapps username:'
    },
    {
      type: (prev, values) => values.authType === 'user' ? 'password' : null,
      name: 'password',
      message: 'enter powerapps password:'
    },
    {
      type: (prev, values) => values.authType === 'client' ? 'password' : null,
      name: 'clientId',
      message: 'enter client id:'
    },
    {
      type: (prev, values) => values.authType === 'client' ? 'password' : null,
      name: 'clientSecret',
      message: 'enter client secret:'
    },
    {
      type: 'text',
      name: 'solution',
      message: 'powerapps solution unique name:'
    }
  ];

  return questions;
}



function done(argv: yargs.Arguments) {
  const message = `
  You have successfully created a new ${argv.type} project!
  
  ## Keeping Up-to-date
  You can keep your build tools up-to-date by updating these two devDependencies:
  * powerapps-project-${argv.type}
  * just-scripts
  
  ## Next Steps
  You can build your project in watch mode with these commands:
      ${pkg.getYarn() ? 'yarn' : 'npm'} start
  You can build your project in production mode with these commands:
      ${pkg.getYarn() ? 'yarn' : 'npm run'} build
  This repository contains code generators that can be triggered by:
      ${pkg.getYarn() ? 'yarn' : 'npm run'} gen
  `;

  logger.info(prettyPrintMarkdown(message));
}