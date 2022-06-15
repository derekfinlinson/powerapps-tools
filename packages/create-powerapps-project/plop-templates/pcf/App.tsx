import React from 'react';
import AppContext from './AppContext';

export interface AppProps {
  context: ComponentFramework.Context<IInputs>;
}

export const App = React.memo((props: AppProps) => {
  const {
    context,
  } = props;

  return (
    <AppContext.Provider value={{ context: context }}>
    </AppContext.Provider>
  );
});

App.displayName = 'App';
