module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        "@microsoft/power-apps"
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        "@microsoft/power-apps/avoid-2011-api": "error",
        "@microsoft/power-apps/avoid-browser-specific-api": "error",
        "@microsoft/power-apps/avoid-crm2011-service-odata": "warn",
        "@microsoft/power-apps/avoid-crm2011-service-soap": "warn",
        "@microsoft/power-apps/avoid-dom-form-event": "warn",
        "@microsoft/power-apps/avoid-dom-form": "warn",
        "@microsoft/power-apps/avoid-isactivitytype": "warn",
        "@microsoft/power-apps/avoid-modals": "warn",
        "@microsoft/power-apps/avoid-unpub-api": "warn",
        "@microsoft/power-apps/avoid-window-top": "warn",
        "@microsoft/power-apps/do-not-make-parent-assumption": "warn",
        "@microsoft/power-apps/use-async": "error",
        "@microsoft/power-apps/use-cached-webresource": "warn",
        "@microsoft/power-apps/use-client-context": "warn",
        "@microsoft/power-apps/use-global-context": "error",
        "@microsoft/power-apps/use-grid-api": "warn",
        "@microsoft/power-apps/use-navigation-api": "warn",
        "@microsoft/power-apps/use-offline": "warn",
        "@microsoft/power-apps/use-org-setting": "error",
        "@microsoft/power-apps/use-relative-uri": "warn",
        "@microsoft/power-apps/use-utility-dialogs": "warn"
    }
};