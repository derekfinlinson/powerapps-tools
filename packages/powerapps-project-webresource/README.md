# powerapps-project-webresource
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-project-webresource.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-project-webresource) |

Plop file generator for Dataverse web resource projects

# Files

* Form script
* Ribbon script
* HTML file

# Generate

Add plopfile.js to project that includes the following. Ensure you have a dataverse.config.json file.

```javascript
module.exports = function (plop) {
  plop.load('powerapps-project-webresource/plopfile.js');
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