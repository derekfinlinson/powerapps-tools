const { tscTask, task, jestTask } = require('just-scripts');

task('build', tscTask());

task('test', jestTask());
