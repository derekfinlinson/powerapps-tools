import { useState, useEffect } from 'react';

export const useTheme = (api: ComponentFramework.WebApi) => {
  const [theme, setTheme] = useState<Record<string, string>>();

  useEffect(() => {
    const getTheme = async () => {
      const options = [
        '?$filter=isdefaulttheme eq true'
      ].join('');

      const theme = await api.retrieveMultipleRecords('theme', options);

      setTheme(theme.entities[0]);
    };

    getTheme();
  }, []);

  return theme;
};