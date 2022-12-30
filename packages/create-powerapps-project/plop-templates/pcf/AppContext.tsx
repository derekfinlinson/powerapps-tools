import React from 'react';
import { IInputs } from './generated/ManifestTypes';

const AppContext = React.createContext<ComponentFramework.Context<IInputs>>({} as ComponentFramework.Context<IInputs>);

interface IAppContextProviderProps {
  context: ComponentFramework.Context<IInputs>;
  children?: React.ReactNode;
}

export const AppContextProvider = (props: IAppContextProviderProps): JSX.Element => {
  const { context, children } = props;

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};

export const useAppContext = (): ComponentFramework.Context<IInputs> => React.useContext(AppContext);
