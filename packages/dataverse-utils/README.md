# dataverse-utils
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/dataverse-utils.svg?style=flat-square)](https://www.npmjs.com/package/dataverse-utils) |

Utilities for interacting with Dataverse environments

# Acquire authorization token

Connection information is stored in dataverse.config.json.

```sh
dataverse-utils auth
```

# Deploy

Deployment configuration is stored in dataverse.config.json.

```sh
dataverse-utils deploy webresource

dataverse-utils deploy assembly
```

# Generate Early-Bound TS Files

Generate early bound TypeScript files for tables

```sh
dataverse-utils generate account
```
