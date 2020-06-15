const { task, series, jestTask, cleanTask, tscTask, eslintTask } = require('just-scripts');

task('jest', jestTask());
task('ts', tscTask());
task('clean', cleanTask());
task('lint', eslintTask());
task('build', series('lint', 'clean', 'ts'));
