import React from 'react';

export enum PrivilegeType {
  None = 0,
  Create = 1,
  Read = 2,
  Write = 3,
  Delete = 4,
  Assign = 5,
  Share = 6,
  Append = 7,
  AppendTo = 8
}

export enum PrivilegeDepth {
  Basic = 0,
  Local = 1,
  Deep = 2,
  Global = 3
}

export const usePrivilege = (table: string, privilege: PrivilegeType, depth: PrivilegeDepth, utils: ComponentFramework.Utility) => {
  const [hasPrivilege, setHasPrivilege] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkPrivilege = async () => {
      // Load metadata first to prevent issue mentioned here: https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility/hasentityprivilege#remarks
      await utils.getEntityMetadata(table);

      const result = utils.hasEntityPrivilege(table, privilege, depth);

      setHasPrivilege(result);
    };

    checkPrivilege();
  }, [table, privilege, depth, utils]);

  return hasPrivilege;
};
