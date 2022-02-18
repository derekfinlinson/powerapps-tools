module.exports = function (plop) {
    plop.setDefaultInclude({ generators: true });

    plop.setGenerator('component', {
        description: '⚛ react component',
        prompts: [
            {
                type: 'input',
                name: 'path',
                message: 'control folder'
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
                path: '{{path}}/components/{{pascalCase name}}.tsx',
                skipIfExists: true
            }
        ]
    });

    plop.setGenerator('hook', {
        description: '⚛ react hook',
        prompts: [
            {
                type: 'input',
                name: 'path',
                message: 'control folder'
            },
            {
                type: 'input',
                name: 'name',
                message: 'hook name'
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/hook.ts.hbs',
                path: '{{path}}/hooks/{{camelCase name}}.tsx',
                skipIfExists: true
            }
        ]
    });
};
