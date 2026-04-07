import eslintjs from '@eslint/js';
import microsoftPowerApps from '@microsoft/eslint-plugin-power-apps';
import pluginPromise from 'eslint-plugin-promise';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['**/generated/', '*.config/*']
  },
  eslintjs.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...typescriptEslint.configs.stylistic,
  pluginPromise.configs['flat/recommended'],
  microsoftPowerApps.configs.paCheckerHosted,
  eslintConfigPrettier.configs.recommended,
  {
    plugins: {
      '@microsoft/power-apps': microsoftPowerApps
    },

    languageOptions: {
      globals: {
        ...globals.browser
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname
      }
    },

    rules: {
      '@microsoft/power-apps/avoid-2011-api': 'error',
      '@microsoft/power-apps/avoid-browser-specific-api': 'error',
      '@microsoft/power-apps/avoid-crm2011-service-odata': 'warn',
      '@microsoft/power-apps/avoid-crm2011-service-soap': 'warn',
      '@microsoft/power-apps/avoid-dom-form-event': 'warn',
      '@microsoft/power-apps/avoid-dom-form': 'warn',
      '@microsoft/power-apps/avoid-isactivitytype': 'warn',
      '@microsoft/power-apps/avoid-modals': 'warn',
      '@microsoft/power-apps/avoid-unpub-api': 'warn',
      '@microsoft/power-apps/avoid-window-top': 'warn',
      '@microsoft/power-apps/do-not-make-parent-assumption': 'warn',
      '@microsoft/power-apps/use-async': 'error',
      '@microsoft/power-apps/use-cached-webresource': 'warn',
      '@microsoft/power-apps/use-client-context': 'warn',
      '@microsoft/power-apps/use-global-context': 'error',
      '@microsoft/power-apps/use-grid-api': 'warn',
      '@microsoft/power-apps/use-navigation-api': 'warn',
      '@microsoft/power-apps/use-offline': 'warn',
      '@microsoft/power-apps/use-org-setting': 'error',
      '@microsoft/power-apps/use-relative-uri': 'warn',
      '@microsoft/power-apps/use-utility-dialogs': 'warn'
    }
  }
];
