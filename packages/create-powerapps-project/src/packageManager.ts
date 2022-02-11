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

export const install = (cwd: string, type: string): void => {
  const packages = getPackages(type);

  if (process.env.JEST_WORKER_ID !== undefined) {
    return;
  }

  if (getYarn()) {
    spawnSync(getYarn(), ['add', ...packages.devDependencies], { stdio: 'inherit', cwd });

    if (packages.dependencies) {
      spawnSync(getYarn(), ['add', ...packages.dependencies], { stdio: 'inherit', cwd });
    }
  } else {
    spawnSync(getNpm(), ['add', ...packages.devDependencies], { stdio: 'inherit', cwd });

    if (packages.dependencies) {
      spawnSync(getNpm(), ['add', ...packages.dependencies], { stdio: 'inherit', cwd });
    }
  }
}

function getPackages(type: string) {
  if (type === 'pcf') {
    return {
      dependencies: [
        'react',
        'react-dom',
        '@fluentui/react'
      ],
      devDependencies: [
        //`powerapps-project-${type}`,
        '@types/react',
        '@types/react-dom'
      ]
    };
  }

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