const path = require('path');
const fs = require('fs');

module.exports = function (plop) {
    plop.setActionType('addToConfig', function (answers, config, plop) {
        const destinationPath = plop.getDestBasePath();
        const configPath = path.resolve(destinationPath, 'dataverse.config.json');

        // Update dataverse.config.json
        if (fs.existsSync(configPath)) {
            const file = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            if (config.resourceType === 'HTML') {
                if (file.webResources != null) {
                    // where does filename come from?                    
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

                fs.writeFileSync(configPath, JSON.stringify(file), 'utf8');

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

                fs.writeFileSync(configPath, JSON.stringify(file), 'utf8');

                return 'added to dataverse.config.json';
            }
        } else {
            return `no dataverse.config.json found at ${destinationPath}`;
        }
    });

    plop.setGenerator('form script', {
        prompts: [
            {
                type: 'text',
                name: 'entity',
                message: 'entity name'
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
                path: 'src/scripts/entities/{{entity}}.ts',
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/form.ts.hbs',
                path: 'src/scripts/{{entity}}Form.ts',
                skipIfExists: true
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
                        return 'no tests';
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
                        return 'no tests';
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
        prompts: [
            {
                type: 'text',
                name: 'entity',
                message: 'entity name'
            },
            {
                type: 'text',
                name: 'function',
                message: 'function name'
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
                path: 'src/scripts/entities/{{entity}}.ts',
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/ribbon.ts.hbs',
                path: 'src/scripts/{{entity}}Ribbon.ts',
                skipIfExists: true
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
}
