import React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { AppContext } from './contexts/AppContext';

export const App = ({ context }: { context: ComponentFramework.Context<IInputs>; }) => {
  return (
    <AppContext.Provider value=\{{ context }}>
    </AppContext.Provider>
  );
};

App.displayName = 'App';
