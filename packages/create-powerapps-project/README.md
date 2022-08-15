# create-powerapps-project
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/create-powerapps-project.svg?style=flat-square)](https://www.npmjs.com/package/create-powerapps-project) |

Project generator for Dataverse development

# Generators

* Web resource project scaffolding
  * [Typescript](https://www.typescriptlang.org/index.html) for JavaScript files
  * [Webpack](https://webpack.js.org/) for bundling
  * [Babel](https://babeljs.io/) for polyfills and compiling ES2015+  
  * Unit tests using [xrm-mock](https://github.com/camelCaseDave/xrm-mock) and [Jest](https://jestjs.io/)
  * Deploy web resources
* Plugin project scaffolding
  * Support for [plugin packages](https://docs.microsoft.com/en-us/power-apps/developer/data-platform/dependent-assembly-plugins) (dependent assemblies)
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
