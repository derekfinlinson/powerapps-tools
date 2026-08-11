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

import React from 'react';

// hasEntityPrivilege can return a false negative if the table's metadata isn't yet cached
// client-side, so prime it with getEntityMetadata first.
// https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility/hasentityprivilege
export const usePrivilege = (table: string, privilege: PrivilegeType, depth: PrivilegeDepth, utils: ComponentFramework.Utility) => {
  const [hasPrivilege, setHasPrivilege] = React.useState(() => utils.hasEntityPrivilege(table, privilege, depth));

  React.useEffect(() => {
    let cancelled = false;

    utils.getEntityMetadata(table).then(() => {
      if (!cancelled) {
        setHasPrivilege(utils.hasEntityPrivilege(table, privilege, depth));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [table, privilege, depth, utils]);

  return hasPrivilege;
};
