import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { PluginAssembly, deployAssembly } from './models/pluginAssembly';
import { DeployCredentials, authenticate } from './powerapps.service';
import { WebApiConfig } from 'xrm-webapi/dist/models';

export async function assembly(type: string) {
  const configFile = glob.sync(`**/config.json`);
  const credsFile = glob.sync('**/creds.json');

  if (configFile.length === 0) {
    console.error('unable to find config.json file');
    return;
  } else if (credsFile.length === 0) {
    console.error('unable to find creds.json file');
    return;
  }

  const currentPath = path.dirname(configFile[0]);

  const config: PluginAssembly = JSON.parse(fs.readFileSync(path.resolve(currentPath, 'config.json'), 'utf8'));
  const creds: DeployCredentials = JSON.parse(fs.readFileSync(path.resolve(currentPath, 'creds.json'), 'utf8'));

  let apiConfig: WebApiConfig;

  try {
    const token = await authenticate(creds);

    apiConfig = new WebApiConfig("8.2", token, creds.server);
  } catch (error) {
    console.error(`authentication failure: ${error}`);
    return;
  }

  console.log(`\r\ndeploy ${type}`);

  try {
    await deployAssembly(config, type, apiConfig, creds.solution);
  } catch (error) {
    console.error(error.message);
    return;
  }

  console.log(`deployed ${type} ${config.name}\r\n`)
}