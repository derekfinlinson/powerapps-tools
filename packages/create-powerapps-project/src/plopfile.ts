import path from 'path';
import { spawnSync } from 'child_process';

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (plop: any): void => {
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
          '../plop-templates/assembly/.gitignore',
          '../plop-templates/assembly/Entities/EarlyBoundGenerator.xml'
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
