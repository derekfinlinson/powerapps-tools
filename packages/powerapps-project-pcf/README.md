# powerapps-project-pcf
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-project-pcf.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-project-pcf) |

Plop file generator for Dataverse Power Apps component framework controls

# Files

* React component

# Generate

Add plopfile.js to project that includes the following.

```javascript
module.exports = function (plop) {
  plop.load('powerapps-project-pcf/plopfile.js');
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