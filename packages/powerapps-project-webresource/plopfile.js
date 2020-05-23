module.exports = function (plop) {
    plop.setGenerator('script', {
        prompts: [
            {
                type: 'text',
                name: 'entity',
                message: 'entity logical name'
            },
            {
                type: 'text',
                name: 'name',
                message: 'script unique name (including solution prefix):'
            },
            {
                type: 'text',
                name: 'displayName',
                message: 'script display name:'
            },
            {
                type: 'confirm',
                name: 'test',
                message: 'include test file?',
                default: true
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/entity.ts.hbs',
                path: 'src/entities/{{entity}}.ts',
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/form.ts.hbs',
                path: 'src/{{entity}}Form.ts',
                skipIfExists: true
            }
        ]
    });

    plop.setGenerator('ribbon script', {
        prompts: [
            {
                type: 'text',
                name: 'entity',
                message: 'entity logical name'
            },
            {
                type: 'text',
                name: 'name',
                message: 'script unique name (including solution prefix):'
            },
            {
                type: 'text',
                name: 'displayName',
                message: 'script display name:'
            },
            {
                type: 'confirm',
                name: 'test',
                message: 'include test file?',
                default: true
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/entity.ts.hbs',
                path: 'src/entities/{{entity}}.ts',
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/ribbon.ts.hbs',
                path: 'src/{{entity}}Ribbon.ts',
                skipIfExists: true
            }
        ]
    });

    plop.setGenerator('html', {
        prompts: [
            {
                type: 'text',
                name: 'filename',
                message: 'filename'
            },
            {
                type: 'text',
                name: 'name',
                message: 'file unique name (including solution prefix):'
            },
            {
                type: 'text',
                name: 'displayName',
                message: 'file display name:'
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/index.html',
                path: 'src/entities/{{filename}}.html'
            }
        ]
    });
}