import createDataverseProject from '../createDataverseProject';
import path from 'path';
import fs from 'fs';
import prompts from 'prompts';

const projectPath = path.resolve(__dirname, '__create__');

beforeEach(async () => {
  await fs.promises.mkdir(projectPath);
  process.chdir(projectPath);
});

afterEach(async () => {
  process.chdir(__dirname);
  await fs.promises.rm(projectPath, { recursive: true, force: true });
});

test('create pcf project', async () => {
  const answers = [
    'field',
    'Pcf',
    'PcfFieldControl',
    true
  ];

  prompts.inject(answers);

  await createDataverseProject('pcf');

  const expectedFiles = [
    'package.json',
    'pcfconfig.json',
    'tsconfig.json',
    '.eslintrc.json',
    '__create__.pcfproj',
    'PcfFieldControl',
    'PcfFieldControl/App.tsx',
    'PcfFieldControl/index.ts',
    'PcfFieldControl/ControlManifest.Input.xml'
  ];

  expectedFiles.forEach(f => {
    expect(fs.existsSync(path.resolve(projectPath, f))).toBeTruthy();
  });

  const indexContent = fs.readFileSync(path.resolve(projectPath, 'PcfFieldControl', 'index.ts'), 'utf8');

  expect(indexContent).toContain("import React from 'react';");
  expect(indexContent).toContain("import ReactDOM from 'react-dom';");
  expect(indexContent).toContain("ReactDOM.render(");
  expect(indexContent).toContain("import { App } from './App';");
  expect(indexContent).toContain("ReactDOM.render(");
});

test('create web resource project', async () => {
  const answers = [
    'Org',
    'https://org.crm.dynamics.com',
    'common',
    'Solution'
  ];

  prompts.inject(answers);

  await createDataverseProject('webresource');

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

  expectedFiles.forEach(f => {
    expect(fs.existsSync(path.resolve(projectPath, f))).toBeTruthy();
  });

  const webpackContent = fs.readFileSync(path.resolve(projectPath, 'webpack.config.js'), 'utf8');

  expect(webpackContent).toContain(`library: ['${answers[0]}', '[name]'],`);

  const dataverseConfig = JSON.parse(fs.readFileSync(path.resolve(projectPath, 'dataverse.config.json'), 'utf8'));

  expect(dataverseConfig.connection.server).toBe(answers[1]);
  expect(dataverseConfig.connection.tenant).toBe(answers[2]);
  expect(dataverseConfig.connection.solution).toBe(answers[3]);
});

test('create plugin project', async () => {
  const answers = [
    '9.0',
    'Namespace',
    2,
    'https://org.crm.dynamics.com',
    'common',
    'Solution'
  ];

  prompts.inject(answers);

  await createDataverseProject('assembly');

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

  expectedFiles.forEach(f => {
    expect(fs.existsSync(path.resolve(projectPath, f))).toBeTruthy();
  });

  const dataverseConfig = JSON.parse(fs.readFileSync(path.resolve(projectPath, 'dataverse.config.json'), 'utf8'));

  expect(dataverseConfig.connection.server).toBe(answers[3]);
  expect(dataverseConfig.connection.tenant).toBe(answers[4]);
  expect(dataverseConfig.connection.solution).toBe(answers[5]);
  expect(dataverseConfig.isolationmode).toBe('2');
});
