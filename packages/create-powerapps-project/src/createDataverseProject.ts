import yargs from 'yargs';
import prompts from 'prompts';
import { getNugetPackageVersions, install } from './nuget';
import path from 'path';
import { getGenerator, runGenerator } from './plop';
import * as pkg from './packageManager';
import { logger, prettyPrintMarkdown } from 'just-scripts-utils';
import { initialize } from './getEnvInfo';

export interface Config {
  name: string;
  isolation: number,
  tenant: string;
  solution: string;
  server: string;
  xrmVersion?: string;
  sdkVersion?: string;
}

export default async function create(argv: yargs.Arguments): Promise<void> {
  await initialize();

  argv.name = path.basename(process.cwd());

  if (!argv.type || (argv.type !== 'webresource' && argv.type !== 'assembly')) {
    const invalid = argv.type !== undefined && argv.type !== 'webresource' && argv.type !== 'assembly';

    const invalidMessage = invalid ? `${argv.type} is not a valid project type.` : '';

    const { type } = await prompts({
      type: 'select',
      name: 'type',
      message: `${invalidMessage} Select dataverse project to create?`,
      choices: [
        { title: 'web resource', value: 'webresource' },
        { title: 'plugin or workflow activity', value: 'assembly' }
      ]
    });

    argv.type = type;
  }

  const questions = await getAnswers(argv.type as string);
  const config: Config = (await prompts(questions)) as Config;

  if (argv.type === 'assembly') {
    const xrmVersions = await getNugetPackageVersions('JourneyTeam.Xrm');

    config.xrmVersion = xrmVersions.shift();
  }

  logger.info('get plop generator');

  const generator = getGenerator(argv);

  logger.info(`run powerapps-project-${argv.type} code generator`);

  await runGenerator(generator, config);

  logger.info('initialize project');

  pkg.install(process.cwd(), argv.type as string);

  if (argv.type === 'assembly') {
    logger.info('add nuget packages');

    install(config.name, config.sdkVersion, config.xrmVersion);
  }

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
}

function done(argv: yargs.Arguments) {
  const message = `
  ${argv.type} project created!
  
  ## Keeping Up-to-date
  keep your build tools up-to-date by updating these two devDependencies:
  * dataverse-utils
  * powerapps-project-${argv.type}
  ${argv.type === 'webresource' ? '* just-scripts' : ''}
  
  ## Next Steps
  ${argv.type === 'webresource' ? `
  build your project in watch mode with this command:
      ${pkg.getYarn() ? 'yarn' : 'npm'} start
  build your project in production mode with this command:
      ${pkg.getYarn() ? 'yarn' : 'npm run'} build` : `
  build your project with this command:
      dotnet build`}
  
  run code generator with this command:
      ${pkg.getYarn() ? 'yarn' : 'npm run'} gen
  `;

  logger.info(prettyPrintMarkdown(message));
}
