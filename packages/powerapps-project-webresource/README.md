# powerapps-project-webresource
| NPM |
| --- |
| [![npm](https://img.shields.io/npm/v/powerapps-project-webresource.svg?style=flat-square)](https://www.npmjs.com/package/powerapps-project-webresource) |

Plop file generator for PowerApps (Dataverse) web resource projects

# Files

* Form script
* Ribbon script
* HTML file

# Generate

Add plopfile.js to project that includes the following:

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