import kleur, { } from 'kleur';

const square = '\u25a0';
const triangle = '\u25b2';
const emptySquare = '\u25a1';

const log = (method: 'info' | 'warn' | 'error', symbol: string, ...args: any[]) => {
  const now = new Date();
  const timestamp = kleur.gray(`[${now.toLocaleTimeString()}]`);

  console[method](timestamp, symbol, args);
};

export const logger = {
  info(...args: any[]): void {
    log('info', kleur.green(square), args);
  },

  warn(...args: any[]): void {
    log('warn', kleur.yellow(triangle), args);
  },

  error(...args: any[]): void {
    log('error', kleur.red(emptySquare), args);
  }
};
