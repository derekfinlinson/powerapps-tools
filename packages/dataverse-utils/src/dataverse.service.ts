import { retrieveMultiple, unboundAction, WebApiConfig } from 'dataverse-webapi/lib/node';

export enum ComponentType {
  WebResource = 61,
  PluginType = 90,
  PluginAssembly = 91,
  SDKMessageProcessingStep = 92,
  SDKMessageProcessingStepImage = 93
}

export interface DeployCredentials {
  server: string;
  tenant: string;
  solution: string;
}

export interface Choice {
  column: string;
  options: { text: string, value: number }[];
}

export interface TableColumn {
  logicalName: string;
  schemaName: string;
}

export interface TableMetadata {
  logicalName: string;
  displayName: string;
  schemaName: string;
  entitySetName: string;
  fields: TableColumn[];
  choices: Choice[];
}

export async function addToSolution(id: string, solution: string, type: ComponentType, apiConfig: WebApiConfig): Promise<void> {
  const data = {
    ComponentId: id,
    ComponentType: type,
    SolutionUniqueName: solution,
    AddRequiredComponents: false,
    IncludedComponentSettingsValues: null
  };

  await unboundAction(apiConfig, 'AddSolutionComponent', data);
}

export async function publish(publishXml: string, apiConfig: WebApiConfig): Promise<void> {
  const data = {
    ParameterXml: `<importexportxml><webresources>${publishXml}</webresources></importexportxml>`
  };

  await unboundAction(apiConfig, 'PublishXml', data);
}

export async function getTableMetadata(table: string, apiConfig: WebApiConfig): Promise<TableMetadata> {
  const options = [
    '?$select=DisplayName,LogicalName,EntitySetName,SchemaName',
    '&$expand=Attributes($select=LogicalName,SchemaName)'
  ].join('');

  const tableDefinition = await retrieveMultiple(apiConfig, `EntityDefinitions(LogicalName='${table}')`, options);

  if (tableDefinition.value.length === 0) {
    throw Error(`Table ${table} not found in metadata cache`);
  }

  const choiceOptions = [
    '?$select=attributevalue,value,attributename',
    `&$filter=objecttypecode eq '${table}'`
  ].join('');

  const choiceMetadata = await retrieveMultiple(apiConfig, 'stringmaps', choiceOptions)

  const metadata = tableDefinition.value[0] as any;

  const tableMetadata: TableMetadata = {
    logicalName: metadata.LogicalName,
    displayName: metadata.DisplayName,
    schemaName: metadata.SchemaName,
    entitySetName: metadata.EntitySetName,
    choices: [],
    fields: metadata.Attributes.map((a: any): TableColumn => {
      return {
        logicalName: a.LogicalName,
        schemaName: a.SchemaName
      }
    })
  };

  choiceMetadata.value.forEach((c: any) => {
    if (tableMetadata.choices.findIndex(x => x.column === c.attributename) === -1) {
      tableMetadata.choices.push({ column: c.column, options: [] });
    }

    tableMetadata.choices.find(x => x.column === c.column)?.options.push({ text: c.value, value: c.attributevalue });
  });

  return tableMetadata;
}
