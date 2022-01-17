import nodePlop, { PlopGenerator } from 'node-plop';
import path from 'path';
import { Config } from './createDataverseProject';

const tick = '√';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGenerator = async (type: string, name: string): Promise<PlopGenerator> => {
  const plopFile = path.resolve(__dirname, 'plopfile.js');

  const plop = await nodePlop(plopFile, { destBasePath: name, force: false })

  const generator = plop.getGenerator(type)

  return generator;
};

export const runGenerator = async (generator: PlopGenerator, args: Config): Promise<void> => {
  const results = await generator.runActions(args, {
    onComment: (comment: string) => {
      console.log(`${tick} ${comment}`);
    }
  });

  if (results.failures && results.failures.length > 0) {
    throw new Error('Error: ' + results.failures[0].error);
  }

  // do something after the actions have run
  for (const change of results.changes) {
    if (change.path) {
      console.log(`${tick} ${change.path}`);
    }
  }
};
