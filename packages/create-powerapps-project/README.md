# create-powerapps-project
| Build | NPM |
| ----- | --- |
| [![Build Status](https://dev.azure.com/derekfinlinson/GitHub/_apis/build/status/derekfinlinson.powerapps-tools?branchName=master)](https://dev.azure.com/derekfinlinson/GitHub/_build/latest?definitionId=9&branchName=master) | [![npm](https://img.shields.io/npm/v/create-powerapps-project.svg?style=flat-square)](https://www.npmjs.com/package/create-powerapps-project) |

Monorepo containing packages for PowerApps development projects

# Packages

| Package                       |  Description                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| create-powerapps-project      | Invoked by npm init powerapps-project, scaffolds projects            |
| powerapps-common              | Library containing common JavaScript methods to use in web resources |
| powerapps-deploy              | CLI to deploy powerapps projects                                     |
| powerapps-project-assembly    | Web resource file templates using plop                               |
| powerapps-project-webresource | Plugin/Workflow Activity file templates using plop                   |

# Generators

* Web resource project scaffolding
  * [Typescript](https://www.typescriptlang.org/index.html) for JavaScript files
  * [Webpack](https://webpack.js.org/) for bundling
  * [Babel](https://babeljs.io/) for polyfills and compiling ES2015+  
  * Unit tests using [xrm-mock](https://github.com/camelCaseDave/xrm-mock) and [Jest](https://jestjs.io/)
  * Deploy web resources
* Plugin project scaffolding
  * Base plugin classes
  * No ILMerge needed
  * Deploy plugin assemblies and types
  * Deploy plugin steps
* Workflow project scaffolding
  * Workflow activity base class
  * No ILMerge needed
  * Deploy workflow assemblies and types

# Create project

```sh
npm init powerapps-project
```

# Add files to project

```sh
npm run gen
```

# Deploy

To deploy, sign in [here](https://login.microsoftonline.com/common/oauth2/authorize?response_type=code&client_id=c67c746f-9745-46eb-83bb-5742263736b7&redirect_uri=https://github.com/derekfinlinson/powerapps-tools) to grant access to your PowerApps organization.

Deployment configuration is stored in config.json. Authentication information is stored in creds.json.

```sh
powerapps-deploy webresource

powerapps-deploy assembly
```