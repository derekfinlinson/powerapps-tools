import { retrieveMultiple, WebApiConfig } from 'dataverse-webapi';
import React from 'react';

export interface TableMetadata {
  table: ComponentFramework.PropertyHelper.EntityMetadata;
  columns: ColumnMetadata[];
  choices: ChoiceColumnMetadata[];
  booleans: BooleanColumnMetadata[];
  states: ChoiceColumnMetadata[];
  statuses: ChoiceColumnMetadata[];
}

export interface ColumnMetadata {
  AttributeType: string;
  DisplayName: string;
  EntityLogicalName: string;
  LogicalName: string;
  MaxValue?: number;
  MinValue?: number;
  MaxLength?: number;
  IsValidForUpdate: boolean;
}

export interface BooleanColumnMetadata extends ColumnMetadata {
  DefaultValue: boolean;
  OptionSet: {
    MetadataId: string;
    Name: string;
    TrueOption: { Value: number; Color: string; Label: { UserLocalizedLabel: { Label: string; } } };
    FalseOption: { Value: number; Color: string; Label: { UserLocalizedLabel: { Label: string; } } };
  };
}

export interface ChoiceColumnMetadata extends ColumnMetadata {
  DefaultFormValue: boolean;
  OptionSet: {
    MetadataId: string;
    Name: string;
    DefaultFormValue: number;
    Options: {
      Value: number;
      Color: string;
      Label: { UserLocalizedLabel: { Label: string } };
    }[];
  };
}

export const useTableMetadata = (utils: ComponentFramework.Utility, tableName: string): TableMetadata | undefined => {
  const [metadata, setMetadata] = React.useState<TableMetadata>();

  const config = new WebApiConfig('9.1');

  React.useEffect(() => {
    const getMetadata = async () => {
      const results = await Promise.all([
        retrieveMultiple(config, `EntityDefinitions(LogicalName='${tableName}')/Attributes`),
        retrieveMultiple(config, `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName,DefaultFormValue&$expand=OptionSet`),
        retrieveMultiple(config, `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.BooleanAttributeMetadata?$select=LogicalName,DefaultValue&$expand=OptionSet`),
        retrieveMultiple(config, `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$select=LogicalName,DefaultFormValue&$expand=OptionSet`),
        retrieveMultiple(config, `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName,DefaultFormValue&$expand=OptionSet`),
        utils.getEntityMetadata(tableName)
      ]);

      const [attributes, optionSets, booleans, states, statuses, table] = results;

      setMetadata({
        table: table,
        columns: <unknown>attributes.value as ColumnMetadata[],
        choices: <unknown>optionSets.value as ChoiceColumnMetadata[],
        booleans: <unknown>booleans.value as BooleanColumnMetadata[],
        states: <unknown>states.value as ChoiceColumnMetadata[],
        statuses: <unknown>statuses.value as ChoiceColumnMetadata[]
      });
    };

    getMetadata();
  }, [tableName]);

  return metadata;
};
