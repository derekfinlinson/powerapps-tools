import kleur from 'kleur';

const isTest = process.env.JEST_WORKER_ID !== undefined;

export const icons = {
  done: kleur.green('◉'),
  info: kleur.cyan('◎'),
  error: kleur.red('⨂'),
  warn: kleur.yellow('⨁')
};

export const logger = {
  info(...args: any[]): void {
    if (!isTest) {
      console.info(icons.info, ...args);
    }
  },

  warn(...args: any[]): void {
    if (!isTest) {
      console.warn(icons.warn, ...args);
    }
  },

  error(...args: any[]): void {
    if (!isTest) {
      console.error(icons.error, ...args);
    }
  },

  done(...args: any[]): void {
    if (!isTest) {
      console.info(icons.done, ...args);
    }
  },
};
