# powerapps-deploy
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-deploy.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-deploy) |

Deploy components to PowerApps environments

# Deploy

To deploy, sign in [here](https://login.microsoftonline.com/common/oauth2/authorize?response_type=code&client_id=c67c746f-9745-46eb-83bb-5742263736b7&redirect_uri=https://github.com/derekfinlinson/powerapps-tools) to grant access to your PowerApps organization.

Deployment configuration is stored in config.json. Authentication information is stored in creds.json.

```sh
powerapps-deploy webresource

powerapps-deploy assembly
```