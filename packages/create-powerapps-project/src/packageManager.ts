/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawnSync } from 'child_process';
import { getEnvInfo } from './getEnvInfo';

export const getYarn = (): any => {
  const yarnInfo = getEnvInfo().Binaries.Yarn;
  return yarnInfo && yarnInfo.path;
};

const getNpm = (): any => {
  const npmInfo = getEnvInfo().Binaries.npm;
  return npmInfo && npmInfo.path;
};

const getPnpm = (): any => {
  const pnpmInfo = getEnvInfo().npmGlobalPackages.pnpm;
  return pnpmInfo && pnpmInfo.path;
};

export const install = (cwd: string, type: string): void => {
  const packages = getPackages(type);

  if (getYarn()) {
    spawnSync(getYarn(), ['add', ...packages.devDependencies], { stdio: 'inherit', cwd });

    if (packages.dependencies) {
      spawnSync(getYarn(), ['add', ...packages.dependencies], { stdio: 'inherit', cwd });
    }
  } else if (getPnpm()) {
    spawnSync(getPnpm(), ['add', ...packages.devDependencies], { stdio: 'inherit', cwd });

    if (packages.dependencies) {
      spawnSync(getPnpm(), ['add', ...packages.dependencies], { stdio: 'inherit', cwd });
    }
  } else {
    spawnSync(getNpm(), ['add', ...packages.devDependencies], { stdio: 'inherit', cwd });

    if (packages.dependencies) {
      spawnSync(getNpm(), ['add', ...packages.dependencies], { stdio: 'inherit', cwd });
    }
  }
}

function getPackages(type: string) {
  const packages: { dependencies?: string[], devDependencies: string[] } = {
    devDependencies: [
      `powerapps-project-${type}`,
      'dataverse-utils'
    ]
  };

  if (type === 'webresource') {
    packages.devDependencies = [
      ...packages.devDependencies,
      '@types/xrm',
      'typescript',
      'eslint',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'webpack-event-plugin',
      'clean-webpack-plugin',
      'source-map-loader',
      'babel-loader',
      'ts-loader',
      '@babel/core',
      '@babel/preset-env',
      '@babel/preset-typescript',
      'xrm-mock',
      'webpack',
      'webpack-cli',
      'cross-spawn',
      'ts-node',
      '-D'
    ];

    packages.dependencies = ['core-js', 'regenerator-runtime', 'powerapps-common', 'dataverse-webapi'];
  }

  return packages;
}