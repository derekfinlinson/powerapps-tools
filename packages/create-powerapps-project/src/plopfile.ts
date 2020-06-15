/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (plop: any): void => {
  plop.setGenerator('webresource', {
    actions: [
      {
        type: 'addMany',
        templateFiles: ['../plop-templates/webresource/*', '../plop-templates/webresource/.*'],
        base: '../plop-templates/webresource',
        destination: process.cwd(),
        force: true
      }
    ]
  });

  plop.setGenerator('assembly', {
    actions: [
      {
        type: 'addMany',
        templateFiles: ['../plop-templates/assembly/*', '../plop-templates/assembly/.*'],
        base: '../plop-templates/assembly',
        destination: process.cwd(),
        force: true
      }
    ]
  });
}
