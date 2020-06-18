const path = require('path');
const fs = require('fs');

module.exports = function (plop) {
    plop.setActionType('addToConfig', function (answers, config, plop) {
        const destinationPath = plop.getDestBasePath();
        const configPath = path.resolve(destinationPath, 'config.json');

        // Update config.json
        if (fs.existsSync(configPath)) {
            const file = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            const filename = `${answers.entity}${config.scriptType}`;

            if (file.webResources != null) {
                file.webResources.push(
                    {
                        path: `./lib/${filename}.js`,
                        name: answers.name,
                        displayname: answers.displayName,
                        type: 'JavaScript'
                    }
                );
            }

            file.entries[filename] = `./src/${filename}.ts`;

            fs.writeFileSync(configPath, JSON.stringify(file), 'utf8');

            return 'added to config.json';
        } else {
            return `no config.json found at ${destinationPath}`;
        }
    });

    plop.setGenerator('form script', {
        prompts: [
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
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/__tests__/{{entity}}Form.test.ts',
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
                path: 'src/__tests__/entity/{{entity}}.test.ts',
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
                scriptType: 'Form'
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
                templateFile: 'plop-templates/ribbon.ts.hbs',
                path: 'src/{{entity}}Ribbon.ts',
                skipIfExists: true
            },
            {
                type: 'add',
                templateFile: 'plop-templates/test.ts.hbs',
                path: 'src/__tests__/{{entity}}Ribbon.test.ts',
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
            {
                type: 'addToConfig',
                scriptType: 'Ribbon'
            }
        ]
    });

    plop.setGenerator('html', {
        prompts: [
            {
                type: 'text',
                name: 'entity',
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
                path: 'src/html/{{filename}}.html'
            },
            {
                type: 'addToConfig'
            }
        ]
    });
}
