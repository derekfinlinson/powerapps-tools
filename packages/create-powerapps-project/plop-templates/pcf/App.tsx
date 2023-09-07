import React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { AppContext } from './contexts/AppContext';
import { initializeIcons } from '@fluentui/react/lib/Icons';

initializeIcons();

export const App = (props: { context: ComponentFramework.Context<IInputs>; }) => {
  const {
    context
  } = props;

  return (
    <AppContext.Provider value={{ context: context }}>
    </AppContext.Provider>
  );
};

App.displayName = 'App';
