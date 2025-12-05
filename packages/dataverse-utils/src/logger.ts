import kleur from 'kleur';
import figures from 'figures';

export const icons = {
  done: kleur.green(figures.tick),
  info: kleur.cyan(figures.pointer),
  error: kleur.red(figures.cross),
  warn: kleur.yellow(figures.warning)
};

export const logger = {
  info(...args: any[]): void {
    console.info(icons.info, ...args);
  },

  warn(...args: any[]): void {
    console.warn(icons.warn, ...args);
  },

  error(...args: any[]): void {
    console.error(icons.error, ...args);
  },

  done(...args: any[]): void {
    console.info(icons.done, ...args);
  },
};
