import type { InitialOptionsTsJest } from 'ts-jest'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  projects: [
    "./packages/*"
  ]
};

export default config;
