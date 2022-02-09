import nodePlop, { PlopGenerator } from 'node-plop';
import path from 'path';
import { logger } from './logger';
import { Config } from './createDataverseProject';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGenerator = async (type: string, name: string): Promise<PlopGenerator> => {
  let plopFile = path.resolve(__dirname, 'plopfile.js');

  if (process.env.JEST_WORKER_ID !== undefined) {
    plopFile = path.resolve(__dirname, 'plopfile.ts');
  }

  const plop = nodePlop(plopFile, { destBasePath: name, force: false });

  const generator = plop.getGenerator(type)

  return generator;
};

export const runGenerator = async (generator: PlopGenerator, args: Config): Promise<void> => {
  const results = await generator.runActions(args, {
    onComment: (comment: string) => {
      logger.info(comment);
    }
  });

  if (results.failures && results.failures.length > 0) {
    throw new Error(results.failures[0].error);
  }

  // do something after the actions have run
  for (const change of results.changes) {
    if (change.path) {
      logger.done(change.path);
    }
  }
};
