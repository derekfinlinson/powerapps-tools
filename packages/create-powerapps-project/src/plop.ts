import nodePlop, { PlopGenerator } from 'node-plop';
import path from 'path';
import { logger } from 'just-scripts-utils';
import yargs from 'yargs';
import { Config } from './createPowerAppsProject';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGenerator = (args: yargs.Arguments): PlopGenerator => {
  const plopFile = path.resolve(__dirname, 'plopfile.js');

  const plop = nodePlop(plopFile, { destBasePath: args.destination as string, force: false })

  const generator = plop.getGenerator(args.type as string)

  return generator;
}

export const runGenerator = async (generator: PlopGenerator, args: Config): Promise<void> => {
  const results = await generator.runActions(args, {
    onComment: (comment: string) => {
      logger.info(comment);
    }
  });

  if (results.failures && results.failures.length > 0) {
    throw new Error('Error: ' + results.failures[0].error);
  }

  // do something after the actions have run
  for (const change of results.changes) {
    if (change.path) {
      logger.info(change.path);
    }
  }
}
