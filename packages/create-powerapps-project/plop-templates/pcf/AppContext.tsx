import * as React from 'react';
import { IInputs } from '../generated/ManifestTypes';

export interface IAppContext {
  context: ComponentFramework.Context<IInputs>;
}

export const AppContext = React.createContext<IAppContext>({} as IAppContext);

export const useAppContext = (): IAppContext => React.useContext(AppContext);
