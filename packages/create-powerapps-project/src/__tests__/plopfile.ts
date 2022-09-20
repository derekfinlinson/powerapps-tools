import path from 'path';
import fs from 'fs';
import nodePlop from 'node-plop';

const projectPath = path.resolve(__dirname, '__create__');
const plop = nodePlop(path.resolve(__dirname, '..', 'plopfile.ts'));

beforeEach(async () => {
  try {
    await fs.promises.mkdir(projectPath);
  } catch (ex) {
    console.log(ex);
  }

  process.chdir(projectPath);
});

afterEach(async () => {
  process.chdir(path.resolve(__dirname));

  try {
    await fs.promises.rm(projectPath, { recursive: true, force: true });
  } catch (ex) {
    console.log(ex);
  }
});

test('create pcf project', async () => {
  const answers = {
    template: 'field',
    namespace: 'Pcf',
    name: 'PcfFieldControl',
    react: true,
    package: 'npm'
  };

  const generator = plop.getGenerator('pcf');

  await generator.runActions(answers);

  const expectedFiles = [
    'package.json',
    'pcfconfig.json',
    'tsconfig.json',
    '.eslintrc.json',
    '__create__.pcfproj',
    'PcfFieldControl',
    'PcfFieldControl/index.ts',
    'PcfFieldControl/ControlManifest.Input.xml'
  ];

  for (const f of expectedFiles) {
    await expect(fs.promises.access(path.resolve(projectPath, f))).resolves.toBeUndefined();
  }

  const indexContent = await fs.promises.readFile(path.resolve(projectPath, 'PcfFieldControl', 'index.ts'), 'utf8');

  expect(indexContent).toContain(`export class ${answers.name}`);
});

test.only('create web resource project', async () => {
  const answers = {
    name: 'webresource',
    namespace: 'Org',
    package: 'npm',
    server: 'https://org.crm.dynamics.com',
    tenant: 'common',
    solution: 'Solution'
  };

  const generator = plop.getGenerator('webresource');

  await generator.runActions(answers);

  const expectedFiles = [
    'package.json',
    '.eslintignore',
    '.eslintrc.js',
    '.gitignore',
    'babel.config.json',
    'browserslist',
    'dataverse.config.json',
    'package.json',
    'plopfile.js',
    'tsconfig.json',
    'webpack.config.js'
  ];

  for (const f of expectedFiles) {
    await expect(fs.promises.access(path.resolve(projectPath, f))).resolves.toBeUndefined();
  }

  const webpackContent = await fs.promises.readFile(path.resolve(projectPath, 'webpack.config.js'), 'utf8');

  expect(webpackContent).toContain(`library: ['${answers.namespace}', '[name]'],`);

  const dataverseConfig = JSON.parse(await fs.promises.readFile(path.resolve(projectPath, 'dataverse.config.json'), 'utf8'));

  expect(dataverseConfig.connection.server).toBe(answers.server);
  expect(dataverseConfig.connection.tenant).toBe(answers.tenant);
  expect(dataverseConfig.connection.solution).toBe(answers.solution);
});

test('create plugin project', async () => {
  const answers = {
    sdkVersion: '9.0',
    name: 'Namespace',
    isolation: 2,
    package: 'npm',
    server: 'https://org.crm.dynamics.com',
    tenant: 'common',
    solution: 'Solution'
  };

  const generator = plop.getGenerator('assembly');

  await generator.runActions(answers);

  const expectedFiles = [
    'package.json',
    'plopfile.js',
    'dataverse.config.json',
    'Namespace.csproj',
    '.gitignore',
    '.editorconfig',
    'Entities',
    'Entities/EarlyBoundGenerator.xml'
  ];

  for (const f of expectedFiles) {
    await expect(fs.promises.access(path.resolve(projectPath, f))).resolves.toBeUndefined();
  }

  const dataverseConfig = JSON.parse(await fs.promises.readFile(path.resolve(projectPath, 'dataverse.config.json'), 'utf8'));

  expect(dataverseConfig.connection.server).toBe(answers.server);
  expect(dataverseConfig.connection.tenant).toBe(answers.tenant);
  expect(dataverseConfig.connection.solution).toBe(answers.solution);
  expect(dataverseConfig.isolationmode).toBe('2');
});
