# dataverse-webapi
|NPM|
|---|
|[![npm](https://img.shields.io/npm/v/dataverse-webapi.svg?style=flat-square)](https://www.npmjs.com/package/dataverse-webapi)|

A Dataverse Web Api TypeScript module for use in web resources or external web apps in the browser or node.

*Requires Dynamics CRM 2016 Online/On-Prem or later*

### Installation

##### Node

```
npm install dataverse-webapi
```
### Usage

#### Browser
```typescript
import { parseGuid, retrieve, WebApiConfig } from 'dataverse-webapi';

const config = new WebApiConfig('9.1')

const account = await retrieve(config, 'accounts', parseGuid('00000000-0000-0000-0000-000000000000'), '$select=name');

console.log(account.name);
```

#### Node
```typescript
import { parseGuid, retrieve, WebApiConfig } from 'dataverse-webapi/lib/node';

const config = new WebApiConfig('9.1', tokenFromAdal, 'https://org.crm.dynamics.com');

const account = await retrieve(config, 'accounts', parseGuid('00000000-0000-0000-0000-000000000000'), '$select=name');

console.log(account.name);
```

#### Angular

For use in Angular applications, I'd first recommend using their built in [HttpClient](https://angular.io/guide/http). Besides batch operations, most D365 Web Api requests are
pretty simple to construct. If you do want to use this library, the usage is the same as the browser usage:

```typescript
import { parseGuid, retrieveNode, WebApiConfig } from 'dataverse-webapi';

const config = new WebApiConfig('8.2', tokenFromAdal, 'https://org.crm.dynamics.com');

const account = await retrieve(config, 'accounts', parseGuid('00000000-0000-0000-0000-000000000000'), '$select=name');

console.log(account.name);
```

#### Supported methods
* Retrieve
* Retrieve multiple (multiple pages)
* Retrieve multiple with Fetch XML
* Create
* Create with returned data
* Update
* Update with returned data
* Update single property
* Delete
* Delete single property
* Associate
* Disassociate
* Web API Functions
* Web API Actions
* Batch operations
* Impersonation using Azure Object Id

#### Samples
See [samples.ts](samples/samples.ts) for examples

### Useful Links

[Web API Reference](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/webapi/perform-operations-web-api)
