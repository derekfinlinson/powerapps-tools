# dataverse-utils
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/dataverse-utils.svg?style=flat-square)](https://www.npmjs.com/package/dataverse-utils) |

Utilities for interacting with Dataverse environments

# Deploy

Deployment configuration is stored in dataverse.config.json. Access token will be acquired via device-code flow.

```sh
dataverse-utils deploy webresource

dataverse-utils deploy assembly
```

# Generate Early-Bound TS Files

Generate early bound TypeScript files for tables. Access token will be acquired via device-code flow.

```sh
dataverse-utils generate account
```
