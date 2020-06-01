module.exports = function (plop) {
    function addToConfig() {

    }
    
    plop.setGenerator('plugin', {
        prompts: [
            {
                type: 'text',
                name: 'name',
                message: 'plugin class name'
            },
            {
                type: 'text',
                name: 'name',
                message: 'enter plugin step name'
            },
            {
                type: 'text',
                name: 'message',
                message: 'enter message (Create, Update, etc)'
            },
            {
                type: 'text',
                name: 'filteringattributes',
                message: 'enter filtering attributes as comma separated list:',
                when: (answers) => {
                    return answers.message === 'Update';
                }
            },
            {
                type: 'text',
                name: 'entity',
                message: 'enter entity logical name (use \'none\' if not for a specific entity)'
            },
            {
                type: 'text',
                name: 'secure',
                message: 'enter secure configuration'
            },
            {
                type: 'text',
                name: 'unsecure',
                message: 'enter unsecure configuration'
            },
            {
                type: 'text',
                name: 'description',
                message: 'enter description'
            },
            {
                type: 'list',
                name: 'mode',
                message: 'select mode',
                choices: [
                    {
                        name: 'synchronous',
                        value: 0
                    },
                    {
                        name: 'asynchronous',
                        value: 1
                    }
                ]
            },
            {
                type: 'number',
                name: 'rank',
                message: 'enter step rank',
                initial: 1
            },
            {
                type: 'select',
                name: 'stage',
                message: 'select stage',
                choices: [
                    {
                        name: 'pre-validation',
                        value: 10
                    },
                    {
                        name: 'pre-operation',
                        value: 20
                    },
                    {
                        name: 'post-operation',
                        value: 40
                    }
                ]
            },
            {
                type: 'select',
                name: 'supporteddeployment',
                message: 'select deployment',
                choices: [
                    {
                        name: 'server only',
                        value: 0
                    },
                    {
                        name: 'microsoft dynamics 365 client for outlook only',
                        value: 1
                    },
                    {
                        name: 'both',
                        value: 2
                    }
                ],
                initial: 0
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/plugin.cs.hbs',
                path: 'Plugins/{{name}}.cs',
                skipIfExists: true
            }
        ]
    });

    plop.setGenerator('workflow activity', {
        prompts: [
            {
                type: 'text',
                name: 'name',
                message: 'workflow activity class name'
            },
            {
                type: 'text',
                name: 'name',
                message: 'enter friendly name'
            },
            {
                type: 'text',
                name: 'group',
                message: 'enter workflow activity group name'
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/workflow.cs.hbs',
                path: 'Activities/{{name}}.cs',
                skipIfExists: true
            }
        ]
    });
}
