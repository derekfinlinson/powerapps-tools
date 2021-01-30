# powerapps-deploy
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-deploy.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-deploy) |

Deploy components to Dataverse environments

# Acquire authorization token

Authentication information is stored in creds.json.

```sh
dataverse-deploy auth
```

# Deploy

Deployment configuration is stored in config.json.

```sh
dataverse-deploy webresource

dataverse-deploy assembly
```