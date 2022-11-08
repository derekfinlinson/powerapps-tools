const path = require('path');
const fs = require('fs');
const version = require('./package').version;

module.exports = (plop) => {
    plop.setWelcomeMessage(`Adding Dataverse webresource file using powerapps-project-webresource v${version}. Please choose type of file to create.`);

    plop.setDefaultInclude({ generators: true });

    plop.setActionType('addToConfig', function (answers, config, plop) {
        const destinationPath = plop.getDestBasePath();
        const configPath = path.resolve(destinationPath, 'dataverse.config.json');

        // Update dataverse.config.json
        if (fs.existsSync(configPath)) {
            const file = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            if (config.resourceType === 'HTML') {
                if (file.webResources != null) {
                    file.webResources.push(
                        {
                            path: `./lib/${answers.filename}.html`,
                            name: answers.name,
                            displayname: answers.displayName,
                            type: config.resourceType
                        },
                        {
                            path: `./lib/${answers.filename}.js`,
                            name: answers.name,
                            displayname: `${answers.displayName} Script`,
                            type: 'JavaScript'
                        }
                    );
                }

                file.entries[filename] = `./src/scripts/${filename}.ts`;

                fs.writeFileSync(configPath, JSON.stringify(file, null, 4), 'utf8');

                return 'added to dataverse.config.json';
            } else {
                const filename = `${answers.entity}${config.scriptType}`;

                if (file.webResources != null) {
                    file.webResources.push(
                        {
                            path: `./lib/${filename}.js`,
                            name: answers.name,
                            displayname: answers.displayName,
                            type: config.resourceType
                        }
                    );
                }

                file.entries[filename] = `./src/scripts/${filename}.ts`;

                fs.writeFileSync(configPath, JSON.stringify(file, null, 4), 'utf8');

                return 'added to dataverse.config.json';
            }
        } else {
            return `no dataverse.config.json found at ${destinationPath}`;
        }
    });

    const scriptPrompts = [
        {
            type: 'input',
            name: 'entity',
            message: 'entity name'
        },
        {
            type: 'input',
            name: 'name',
            message: 'script unique name (including publisher prefix)',
            validate: (answers) => {
                if (answers.name.indexOf('_') === -1) {
                    return 'include publisher prefix in name';
                }

                return true;
            }
        },
        {
            type: 'input',
            name: 'displayName',
            message: 'script display name'
        },
        {
            type: 'confirm',
            name: 'entityFile',
            message: 'include entity file?',
            default: true
        },
        {
            type: 'confirm',
            name: 'test',
            message: 'include test file?',
            default: true
        }
    ];

    plop.setGenerator('form script', {
        description: 'dataverse form script',
        prompts: scriptPrompts,
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/entity.ts.hbs',
                path: 'src/scripts/entities/{{entity}}.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.entityFile) {
                        return;
                    } else {
                        return 'skip entity file';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/form.ts.hbs',
                path: 'src/scripts/{{entity}}Form.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.entityFile) {
                        return;
                    } else {
                        return 'skip form file with entity';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/form.noentity.ts.hbs',
                path: 'src/scripts/{{entity}}Form.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (!data.entityFile) {
                        return;
                    } else {
                        return 'skip form file without entity';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/scripts/__tests__/{{entity}}Form.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test) {
                        return;
                    } else {
                        return 'skip test file';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/entity.test.ts.hbs',
                path: 'src/scripts/entities/__tests__/{{entity}}.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test) {
                        return;
                    } else {
                        return 'skip entity test file';
                    }
                }
            },
            {
                type: 'addToConfig',
                scriptType: 'Form',
                resourceType: 'JavaScript'
            }
        ]
    });

    plop.setGenerator('ribbon script', {
        description: 'dataverse ribbon script',
        prompts: [
            ...scriptPrompts,
            {
                type: 'input',
                name: 'function',
                message: 'function name'
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/entity.ts.hbs',
                path: 'src/scripts/entities/{{entity}}.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.entityFile) {
                        return;
                    } else {
                        return 'no entity file';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/ribbon.ts.hbs',
                path: 'src/scripts/{{entity}}Ribbon.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.entityFile) {
                        return;
                    } else {
                        return 'skip form file with entity';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/ribbon.noentity.ts.hbs',
                path: 'src/scripts/{{entity}}Ribbon.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (!data.entityFile) {
                        return;
                    } else {
                        return 'skip form file without entity';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/scripts/__tests__/{{entity}}Ribbon.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test) {
                        return;
                    } else {
                        return 'no test';
                    }
                }
            },
            {
                type: 'add',
                templateFile: 'plop-templates/entity.test.ts.hbs',
                path: 'src/scripts/entities/__tests__/{{entity}}.test.ts',
                skipIfExists: true,
                skip: (data) => {
                    if (data.test) {
                        return;
                    } else {
                        return 'no test';
                    }
                }
            },
            {
                type: 'addToConfig',
                scriptType: 'Ribbon',
                resourceType: 'JavaScript'
            }
        ]
    });

    plop.setGenerator('html', {
        description: 'dataverse html file',
        prompts: [
            {
                type: 'input',
                name: 'filename',
                message: 'filename'
            },
            {
                type: 'input',
                name: 'name',
                message: 'file unique name (including publisher prefix)'
            },
            {
                type: 'input',
                name: 'displayName',
                message: 'file display name'
            }
        ],
        actions: [
            {
                type: 'add',
                templateFile: 'plop-templates/index.html',
                path: 'public/{{filename}}.html'
            },
            {
                type: 'add',
                path: 'src/scripts/{{filename}}.ts'
            },
            {
                type: 'addToConfig',
                resouceType: 'HTML'
            }
        ]
    });
};
