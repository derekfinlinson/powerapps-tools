# powerapps-project-assembly
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-project-assembly.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-project-assembly) |

Plop file generator for Dataverse plugin/workflow activity projects

# Files

* Plugin class
* Plugin class for Custom API
* Plugin step
* Plugin image
* Custom API

# Generate

Add plopfile.js to project that includes the following. Ensure you have a dataverse.config.json file.

```javascript
module.exports = function (plop) {
  plop.load('powerapps-project-assembly/plopfile.js');
}
```

Run plop

```sh
npm run plop
```

or

```sh
yarn plop
```