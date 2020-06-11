module.exports = function (plop) {
    function addToConfig(data) {
        const destinationPath = process.cwd();
        const configPath = path.resolve(destinationPath, 'config.json');

        // Update config.json
        if (fs.existsSync(configPath)) {
            const file = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            const filename = data.entity + data.type === 0 ? 'Form' : 'Ribbon';

            if (file.webResources != null) {
                file.webResources.push(
                    {
                        path: `./dist/scripts/${filename}.js`,
                        name: data.name,
                        displayname: data.displayName,
                        type: 'JavaScript'
                    }
                );
            }

            file.entries[filename] = `./src/scripts/${filename}.ts`;

            fs.writeFileSync(configPath, JSON.stringify(file), 'utf8');
        }
    }

    plop.setGenerator('script', {
        prompts: [
            {
                type: 'list',
                name: 'type',
                message: 'select script type',
                choices: [
                    {
                        name: 'form',
                        value: 0
                    },
                    {
                        name: 'ribbon',
                        value: 1
                    }
                ]
            },
            {
                type: 'text',
                name: 'entity',
                message: 'entity logical name'
            },
            {
                type: 'text',
                name: 'name',
                message: 'script unique name (including solution prefix)'
            },
            {
                type: 'text',
                name: 'displayName',
                message: 'script display name'
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
                skipIfExists: true,
                skip: (data) => {
                    if (data.type === 1) {
                        return 'is ribbon script';
                    } else {
                        return;
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/ribbon.ts.hbs',
                path: 'src/{{entity}}Ribbon.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.type === 0) {
                        return 'is form script';
                    } else {
                        return;
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/__tests__/{{entity}}Ribbon.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test && data.type === 1) {
                        return;
                    } else {
                        return 'no test';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/__tests__/{{entity}}Form.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test && data.type === 0) {
                        return;
                    } else {
                        return 'no test';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/__tests__/entity/{{entity}}.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test) {
                        return;
                    } else {
                        return 'no test';
                    }
                }
            },
            addToConfig
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
                message: 'file unique name (including solution prefix)'
            },
            {
                type: 'text',
                name: 'displayName',
                message: 'file display name'
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/index.html',
                path: 'src/entities/{{filename}}.html'
            },
            addToConfig
        ]
    });
}
