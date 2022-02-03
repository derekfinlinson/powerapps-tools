import React from 'react';
import { ThemeProvider } from '@fluentui/react/lib/utilities/ThemeProvider/ThemeProvider';

export interface AppProps {
  isTestHarness: boolean;
}

export const App = React.memo((props: AppProps) => {
  const {
    isTestHarness
  } = props;
  
  return (
    <ThemeProvider dir='ltr'>
    </ThemeProvider>
  );
});

App.displayName = 'App';

