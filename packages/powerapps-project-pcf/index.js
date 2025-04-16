import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';

export default function (plop) {
  plop.setDefaultInclude({ generators: true });

  plop.setPrompt('file-tree-selection', inquirerFileTreeSelection);

  plop.setGenerator('component', {
    description: '⚛ react component',
    prompts: [
      {
        type: 'file-tree-selection',
        name: 'path',
        onlyShowDir: true,
        message: 'directory'
      },
      {
        type: 'input',
        name: 'name',
        message: 'component name'
      }
    ],
    actions: [
      {
        type: 'add',
        templateFile: 'plop-templates/component.tsx.hbs',
        path: '{{path}}/{{pascalCase name}}.tsx',
        skipIfExists: true
      }
    ]
  });

  plop.setGenerator('hook', {
    description: '⚛ react hook',
    prompts: [
      {
        type: 'file-tree-selection',
        name: 'path',
        onlyShowDir: true,
        message: 'directory'
      },
      {
        type: 'input',
        name: 'name',
        message: 'hook name',
        validate: (answer) => {
          if (answer.length > 3 && answer.substring(0, 3) !== 'use') {
            return "hook name must start with 'use'";
          }

          return true;
        }
      }
    ],
    actions: [
      {
        type: 'add',
        templateFile: 'plop-templates/hook.ts.hbs',
        path: '{{path}}/{{camelCase name}}.tsx',
        skipIfExists: true
      }
    ]
  });

  plop.setGenerator('context', {
    description: '⚛ react context',
    prompts: [
      {
        type: 'file-tree-selection',
        name: 'path',
        onlyShowDir: true,
        message: 'control folder'
      },
      {
        type: 'input',
        name: 'name',
        message: 'context name'
      }
    ],
    actions: [
      {
        type: 'add',
        templateFile: 'plop-templates/context.ts.hbs',
        path: '{{path}}/{{camelCase name}}.tsx',
        skipIfExists: true
      }
    ]
  });
};
