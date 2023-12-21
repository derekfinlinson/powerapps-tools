import React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { AppContext } from './contexts/AppContext';
import { FluentProvider, IdPrefixProvider, webLightTheme } from '@fluentui/react-components';

export const App = (props: { context: ComponentFramework.Context<IInputs>; }) => {
  const {
    context
  } = props;

  return (
    <IdPrefixProvider value="AdasCertification">
      <FluentProvider theme={webLightTheme}>
        <AppContext.Provider value=\{{ context }}>
        </AppContext.Provider>
      </FluentProvider>
    </IdPrefixProvider>
  );
};

App.displayName = 'App';
