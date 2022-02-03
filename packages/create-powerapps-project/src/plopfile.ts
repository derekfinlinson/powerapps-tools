import path from 'path';
import { spawnSync } from 'child_process';
import fs from 'fs';

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (plop: any): void => {
  plop.setActionType('signAssembly', (answers) => {
    const keyPath = path.resolve(process.cwd(), `${answers.name}.snk`);
    spawnSync(path.resolve(__dirname, '../', 'bin', 'sn.exe'), ['-q', '-k', keyPath], { stdio: 'inherit' });
    return 'signed assembly';
  });

  plop.setActionType('runPcf', (answers) => {
    spawnSync('pac', ['pcf', 'init', '--namespace', answers.namespace, '--name', answers.name, '--template', answers.template], { stdio: 'inherit' });

    return 'pcf project created';
  });

  plop.setActionType('addGenScript', () => {
    const packagePath = path.resolve(process.cwd(), 'package.json');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(packagePath);

    packageJson.scripts.push('"gen": "plop"');

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 4), 'utf8');
  });

  plop.setGenerator('webresource', {
    actions: [
      {
        type: 'addMany',
        templateFiles: ['../plop-templates/webresource/*', '../plop-templates/webresource/.*'],
        base: '../plop-templates/webresource',
        destination: process.cwd(),
        force: true
      }
    ]
  });

  plop.setGenerator('pcf', {
    actions: [
      {
        type: 'runPcf'
      },
      {
        type: 'addMany',
        templateFiles: [
          '../plop-templates/pcf/App.tsx',
          '../plop-templates/pcf/index.ts'
        ],
        base: '../plop-templates/pcf',
        destination: `${process.cwd()}/{{ name }}`,
        force: true,
        skip: (answers) => {
          return !answers.react;
        }
      },
      {
        type: 'addGenScript',
        skip: (answers) => {
          return !answers.react;
        }
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
          '../plop-templates/assembly/*.ts.hbs',
          '../plop-templates/assembly/.gitignore',
          '../plop-templates/assembly/Entities/EarlyBoundGenerator.xml',
          '../plop-templates/assembly/.vscode/tasks.json',
          '../plop-templates/assembly/.editorconfig'
        ],
        base: '../plop-templates/assembly',
        destination: process.cwd(),
        force: true
      },
      {
        type: 'signAssembly'
      }
    ]
  });
}
