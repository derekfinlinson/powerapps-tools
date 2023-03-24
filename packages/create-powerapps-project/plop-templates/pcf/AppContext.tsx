import React from 'react';
import { IInputs } from './generated/ManifestTypes';

interface IAppContext {
  context: ComponentFramework.Context<IInputs>;
  theme?: Record<string, string>;
}

const AppContext = React.createContext<IAppContext>({} as IAppContext);

interface IAppContextProviderProps extends IAppContext {
  children?: React.ReactNode;
}

export const AppContextProvider = (props: IAppContextProviderProps): JSX.Element => {
  const { context, children } = props;

  return <AppContext.Provider value={{ context }}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContext => React.useContext(AppContext);
