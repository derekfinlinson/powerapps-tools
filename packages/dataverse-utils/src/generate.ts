import fs from 'fs';
import path from 'path';
import { logger } from 'just-scripts-utils';
import { DeployCredentials, getTableMetadata, TableMetadata } from './dataverse.service';
import { WebApiConfig } from 'dataverse-webapi/lib/node';
import { getTokenFromCache } from './tokenCache';

export default async function deploy(table: string): Promise<void> {
  const currentPath = '.';
  const credsFile = fs.readFileSync(path.resolve(currentPath, 'dataverse.config.json'), 'utf8');

  if (credsFile == null) {
    logger.warn('unable to find dataverse.config.json file');
    return;
  }

  const creds: DeployCredentials = JSON.parse(credsFile).connection;

  const token = getTokenFromCache(creds.server);

  if (!token.accessToken) {
    logger.error('use dataverse-utils auth command to get access token before deploying');
    return;
  }

  const apiConfig = new WebApiConfig('8.2', token.accessToken, creds.server);

  let metadata: TableMetadata = {} as TableMetadata;

  logger.info('Retrieve table metadata');

  try {
    metadata = await getTableMetadata(table, apiConfig);
  } catch (error) {
    logger.error(error.message);
  }

  logger.info('Write table metadata to file');

  // Build code file from metadata
  const codeFile = [
    `class ${metadata.schemaName} {`,
    `  LogicalName = '${metadata.logicalName}';`,
    `  SchemaName = '${metadata.schemaName}';`,
    `  DisplayName = '${metadata.displayName}';`,
    `  EntitySetName = '${metadata.entitySetName}';`,
    '\r\n',
    '  Fields = {',
    metadata.fields.map(f => {
      return `'${f.schemaName}': '${f.logicalName}'`;
    }).join(',\r\n'),
    '}',
    '\r\n',
    metadata.choices.map(c => `  ${c.column} = ${metadata.schemaName}_${c.column}`).join('\r\n'),
    '}',
    '\r\n',
    metadata.choices.map(c => {
      return [
        `export enum ${metadata.schemaName}_${c.column} {`,
        '\r\n',
        c.options.map(x => `  ${x.text} = ${x.value}`).join(',\r\n'),
        '\r\n',
        '}'
      ].join('')
    }).join('\r\n\r\n'),
    '\r\n',
    `export default new ${metadata.schemaName}()`
  ].join('');

  fs.writeFileSync(path.resolve(currentPath, 'models', `${metadata.schemaName}.ts`), codeFile);

  logger.info(`Wrote table metadata to models/${metadata.schemaName}.ts`);
}
