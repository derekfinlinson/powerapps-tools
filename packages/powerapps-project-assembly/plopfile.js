module.exports = function (plop) {
    const getNamespace = () => {
        // Get namespace from csproj file
        let files;
        let folder = plop.getDestBasePath();

        // Find csproj file
        do {
            files = fs.readdirSync(folder).filter(f => f.endsWith('.csproj'));
            folder = path.resolve(folder, '..');
        } while (files.length === 0 && !path.isAbsolute(folder))

        // Return csproj name as default namespace
        return files.length === 0 ? 'Xrm' : path.basename(files[0]).replace('.csproj', '');
    };

    const addToConfig = (data) => {
        const destinationPath = plop.getDestBasePath();
        const configPath = path.resolve(destinationPath, 'config.json');

        // Check if config.json exists
        if (fs.existsSync(configPath)) {
            const file = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            if (file.types == null) {
                file.types = [];
            }

            // Get namespace
            const namespace = getNamespace();

            // Create plugin type config
            const type = {
                name: `${namespace}.${data.filename}`,
                typename: `${namespace}.${data.filename}`,
                friendlyname: data.friendlyname || `${namespace}.${data.filename}`,
                workflowactivitygroupname: data.group,
                steps: []
            };

            // Add plugin step config
            if (data.name !== undefined) {
                type.steps.push(
                    {
                        name: data.name,
                        message: data.message,
                        entity: data.entity,
                        configuration: data.configuration,
                        description: data.description,
                        mode: data.mode,
                        rank: data.rank,
                        stage: data.stage,
                        supporteddeployment: data.supporteddeployment,
                        filteringattributes: data.filteringattributes
                    }
                );
            }

            file.types.push(type);

            // Update config.json
            fs.writeFileSync(configPath, JSON.stringify(file), 'utf8');
        }
    };

    const addStepConfig = (data) => {
        const destinationPath = process.cwd();
        const configPath = path.resolve(destinationPath, 'config.json');

        // Get config.json if it exists
        if (fs.existsSync(configPath)) {
            const file = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            // If no types property found, just run assembly addToConfig
            if (file.types == null) {
                addToConfig(data);
                return;
            }

            const namespace = getNamespace();

            const type = file.types.filter(t => t.name === `${namespace}.${data.filename}`);

            // If plugin type not already in file, run assembly addToConfig
            if (type.length === 0) {
                addToConfig(data);
            } else {
                // Add step to existing config
                type.steps.push(
                    {
                        name: data.name,
                        message: data.message,
                        entity: data.entity,
                        configuration: data.configuration,
                        description: data.description,
                        mode: data.mode,
                        rank: data.rank,
                        stage: data.stage,
                        supporteddeployment: data.supporteddeployment,
                        filteringattributes: data.filteringattributes
                    }
                );
            }
        }

        // Update file
        fs.writeFileSync(configPath, JSON.stringify(file), 'utf8');
    };

    const stepPrompts = [
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
    ];

    plop.setGenerator('plugin', {
        prompts: [
            {
                type: 'text',
                name: 'filename',
                message: 'plugin class name'
            },
            ...stepPrompts
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/plugin.cs.hbs',
                path: 'Plugins/{{name}}.cs',
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/entity.cs.hbs',
                path: 'EntityExtensions/{{name}}.cs',
                skipIfExists: true,
                skip: (data) => {
                    if (!data.entity) {
                        return 'no entity entered';
                    } else {
                        return;
                    }
                }
            },
            addToConfig
        ]
    });

    plop.setGenerator('workflow activity', {
        prompts: [
            {
                type: 'text',
                name: 'filename',
                message: 'workflow activity class name'
            },
            {
                type: 'text',
                name: 'friendlyname',
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
            },
            addToConfig
        ]
    });

    plop.setGenerator('plugin step', {
        prompts: [
            {
                type: 'text',
                name: 'filename',
                message: 'plugin class name'
            },
            ...stepPrompts
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/entity.cs.hbs',
                path: 'EntityExtensions/{{name}}.cs',
                skipIfExists: true,
                skip: (data) => {
                    if (!data.entity) {
                        return 'no entity entered';
                    } else {
                        return;
                    }
                }
            },
            addStepConfig
        ]
    });
};
