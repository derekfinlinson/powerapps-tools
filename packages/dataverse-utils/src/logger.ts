import kleur from 'kleur';

const tick = '√', cross = '×';

const log = (method: 'info' | 'warn' | 'error', symbol: string, ...args: any[]) => {
  console[method](symbol, ...args);
};

export const logger = {
  info(...args: any[]): void {
    log('info', kleur.green(tick), ...args);
  },

  warn(...args: any[]): void {
    log('warn', kleur.yellow(cross), ...args);
  },

  error(...args: any[]): void {
    log('error', kleur.red(cross), ...args);
  }
};
