import React from 'react';
import { IInputs } from './generated/ManifestTypes';

interface IAppContext {
  context: ComponentFramework.Context<IInputs>;
}

const AppContext = React.createContext<IAppContext>({} as IAppContext);

export default AppContext;
