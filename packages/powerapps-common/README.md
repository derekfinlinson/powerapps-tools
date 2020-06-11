# d365-common
|Build|NPM|
|-----|---|
|[![Build Status](https://dev.azure.com/derekfinlinson/GitHub/_apis/build/status/derekfinlinson.d365-common?branchName=master)](https://dev.azure.com/derekfinlinson/GitHub/_build/latest?definitionId=7&branchName=master)|[![npm](https://img.shields.io/npm/v/d365-common.svg?style=flat-square)](https://www.npmjs.com/package/d365-common)|

A Dynamics 365 module including common functions used in JavaScript web resource development.

### Installation

##### Node

```
npm install --save-dev d365-common
```
### Usage

Import the module into your TypeScript/JavaScript files

```typescript
import { setFieldRequirementLevel } from 'd365-common';

setFieldRequirementLevel('accountnumber', 'required');
```

For Dynamics versions less than 9.0

```typescript
import { setFieldRequirementLevel } from 'd365-common\dist\v8\index';

setFieldRequirementLevel('accountnumber', 'required');
```
