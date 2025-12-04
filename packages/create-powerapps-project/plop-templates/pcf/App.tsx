import * as React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { AppContext } from './contexts/AppContext';
import { FluentProvider, Theme } from "@fluentui/react-components";

export function App({ context }: { context: ComponentFramework.Context<IInputs>; }) {
  return (
    <AppContext.Provider value=\{{ context }}>
      <FluentProvider theme={context.fluentDesignLanguage?.tokenTheme as Theme}>
      </FluentProvider>
    </AppContext.Provider>
  );
}
