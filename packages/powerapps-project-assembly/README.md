# powerapps-project-assembly
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-project-assembly.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-project-assembly) |

Plop file generator for PowerApps (Dataverse) plugin/workflow activity projects

# Files

* Plugin class
* Plugin step
* Plugin image

# Generate

Add plopfile.js to project that includes the following:

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