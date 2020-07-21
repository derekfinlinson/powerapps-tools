import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (plop: any): void => {
  plop.setActionType('rename', (_answers, config, plop) => {
    const { src, dest, force } = config;

    if (!src || !dest) {
      throw new Error('both the "src" and "dest" configuration are needed for this action');
    }

    let destFileName = '';

    if (typeof dest === 'string') {
      destFileName = dest;
    } else if (typeof dest === 'function') {
      destFileName = dest(src);
    } else {
      throw new Error('"dest" can only be a string or function');
    }

    const srcFilePath = path.join(plop.getDestBasePath(), src);
    const destFilePath = path.join(plop.getDestBasePath(), destFileName);

    if (!fs.existsSync(srcFilePath)) {
      throw new Error(`${srcFilePath} does not exist`);
    }

    if (fs.existsSync(destFilePath) && !force) {
      throw new Error(`${destFilePath} already exists!`);
    }

    fs.renameSync(srcFilePath, destFilePath);

    return `successfully renamed ${srcFilePath} to ${destFilePath}`;
  });

  plop.setActionType('signAssembly', (answers) => {
    const keyPath = path.resolve(process.cwd(), `${answers.name}.snk`);
    spawnSync(path.resolve(__dirname, '../', 'bin', 'sn.exe'), ['-q', '-k', keyPath], { stdio: 'inherit' });
    return 'signed assembly';
  });

  plop.setGenerator('webresource', {
    actions: [
      {
        type: 'addMany',
        templateFiles: ['../plop-templates/webresource/*', '../plop-templates/webresource/.*'],
        base: '../plop-templates/webresource',
        destination: process.cwd(),
        force: true
      },
      {
        type: 'rename',
        src: 'gitignore',
        dest: '.gitignore'
      },
      {
        type: 'rename',
        src: 'eslintrc.js',
        dest: '.eslintrc.js'
      },
      {
        type: 'rename',
        src: 'eslintignore',
        dest: '.eslintignore'
      }
    ]
  });

  plop.setGenerator('assembly', {
    actions: [
      {
        type: 'add',
        templateFile: '../plop-templates/assembly/assembly.csproj.hbs',
        path: path.resolve(process.cwd(), '{{name}}.csproj'),
      },
      {
        type: 'addMany',
        templateFiles: [
          '../plop-templates/assembly/*.json.hbs',
          '../plop-templates/assembly/*.js',
          '../plop-templates/assembly/gitignore',
          '../plop-templates/assembly/Entities/EarlyBoundGenerator.xml'
        ],
        base: '../plop-templates/assembly',
        destination: process.cwd(),
        force: true
      },
      {
        type: 'rename',
        src: 'gitignore',
        dest: '.gitignore'
      },
      {
        type: 'signAssembly'
      }
    ]
  });
}
