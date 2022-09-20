import kleur from 'kleur';
import figures from 'figures';

const isTest = process.env.JEST_WORKER_ID !== undefined;

export const icons = {
  done: kleur.green(figures.tick),
  info: kleur.cyan(figures.pointer),
  error: kleur.red(figures.cross),
  warn: kleur.yellow(figures.warning)
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
