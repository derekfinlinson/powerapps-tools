# powerapps-tools

| Build |
| ----- |
| [![Build Status](https://dev.azure.com/derekfinlinson/GitHub/_apis/build/status/derekfinlinson.powerapps-tools?branchName=master)](https://dev.azure.com/derekfinlinson/GitHub/_build/latest?definitionId=9&branchName=master) |

Monorepo containing packages for Dataverse development projects

# Packages

| Package                       |  Description                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| [create-powerapps-project](packages/create-powerapps-project)      | Invoked by npm init powerapps-project, scaffolds projects            |
| [powerapps-common](packages/powerapps-common)              | Library containing common JavaScript methods to use in web resources |
| [powerapps-deploy](packages/powerapps-deploy)              | CLI to deploy dataverse projects                                     |
| [powerapps-project-assembly](packages/powerapps-project-assembly)    | Plugin/Workflow Activity file templates using plop                               |
| [powerapps-project-webresource](packages/powerapps-project-webresource) | Web resource file templates using plop                   |