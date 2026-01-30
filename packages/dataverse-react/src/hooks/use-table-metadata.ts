import { retrieveAlternateKey, retrieveMultiple, WebApiConfig } from 'dataverse-webapi';
import React from 'react';

export interface TableMetadata {
  table: EntityMetadata;
  columns: ColumnMetadata[];
  choices: ChoiceColumnMetadata[];
  booleans: BooleanColumnMetadata[];
  states: ChoiceColumnMetadata[];
  statuses: ChoiceColumnMetadata[];
}

export interface EntityMetadata {
  LogicalName: string;
  DisplayName: Label;
  SchemaName: string;
  LogicalCollectionName: string;
  CollectionSchemaName: string;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  TableType: 'Standard' | 'Activity' | 'Virtual';
  PrimaryImageAttribute: string | null;
  [key: string]: any;
}

export interface ColumnMetadata {
  Targets?: string[];
  AttributeType:
    | 'Boolean'
    | 'Customer'
    | 'DateTime'
    | 'Decimal'
    | 'Double'
    | 'Integer'
    | 'Lookup'
    | 'Memo'
    | 'Money'
    | 'Owner'
    | 'PartyList'
    | 'Picklist'
    | 'State'
    | 'Status'
    | 'String'
    | 'Uniqueidentifier'
    | 'CalendarRules'
    | 'Virtual'
    | 'BigInt'
    | 'ManagedProperty'
    | 'EntityName';
  AttributeTypeName: {
    Value:
      | 'BigIntType'
      | 'BooleanType'
      | 'CalendarRulesType'
      | 'CustomerType'
      | 'CustomType'
      | 'DateTimeType'
      | 'DecimalType'
      | 'DoubleType'
      | 'EntityNameType'
      | 'FileType'
      | 'ImageType'
      | 'IntegerType'
      | 'LookupType'
      | 'ManagedPropertyType'
      | 'MemoType'
      | 'MoneyType'
      | 'MultiSelectPicklistType'
      | 'OwnerType'
      | 'PartyListType'
      | 'PicklistType'
      | 'StateType'
      | 'StatusType'
      | 'StringType'
      | 'UniqueidentifierType'
      | 'VirtualType';
  };
  DisplayName: Label;
  EntityLogicalName: string;
  LogicalName: string;
  MaxValue?: number;
  MinValue?: number;
  MaxLength?: number;
  IsValidForUpdate: boolean;
  IsValidForCreate: boolean;
  IsPrimaryId: boolean;
  IsCustomAttribute: boolean;
  SchemaName: string;
  Precision?: number;
}

export interface BooleanColumnMetadata extends ColumnMetadata {
  DefaultValue: boolean;
  OptionSet: {
    MetadataId: string;
    Name: string;
    TrueOption: {
      Value: number;
      Color: string;
      Label: Label;
    };
    FalseOption: {
      Value: number;
      Color: string;
      Label: Label;
    };
  };
}

export interface ChoiceColumnMetadata extends ColumnMetadata {
  DefaultFormValue: boolean;
  OptionSet: {
    MetadataId: string;
    Name: string;
    DefaultFormValue: number;
    Options: OptionMetadata[];
  };
}

export interface OptionMetadata {
  Value: number;
  Color: string;
  State?: number;
  Label: Label;
}

export interface Label {
  UserLocalizedLabel: { Label: string };
  LocalizedLabel: {
    Label: string;
  };
}

export const useTableMetadata = (tableName?: string): TableMetadata | undefined => {
  const [metadata, setMetadata] = React.useState<TableMetadata>();

  const config = new WebApiConfig('9.1');

  React.useEffect(() => {
    const getMetadata = async () => {
      const results = await Promise.all([
        retrieveMultiple(config, `EntityDefinitions(LogicalName='${tableName}')/Attributes`),
        retrieveMultiple(
          config,
          `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName,DefaultFormValue&$expand=OptionSet`
        ),
        retrieveMultiple(
          config,
          `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.BooleanAttributeMetadata?$select=LogicalName,DefaultValue&$expand=OptionSet`
        ),
        retrieveMultiple(
          config,
          `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$select=LogicalName,DefaultFormValue&$expand=OptionSet`
        ),
        retrieveMultiple(
          config,
          `EntityDefinitions(LogicalName='${tableName}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName,DefaultFormValue&$expand=OptionSet`
        ),
        retrieveAlternateKey(config, 'EntityDefinitions', `LogicalName='${tableName}'`)
      ]);

      const [attributes, optionSets, booleans, states, statuses, table] = results;

      setMetadata({
        table: table as EntityMetadata,
        columns: (<unknown>attributes.value) as ColumnMetadata[],
        choices: (<unknown>optionSets.value) as ChoiceColumnMetadata[],
        booleans: (<unknown>booleans.value) as BooleanColumnMetadata[],
        states: (<unknown>states.value) as ChoiceColumnMetadata[],
        statuses: (<unknown>statuses.value) as ChoiceColumnMetadata[]
      });
    };

    if (tableName) {
      getMetadata();
    }
  }, [tableName]);

  return metadata;
};
