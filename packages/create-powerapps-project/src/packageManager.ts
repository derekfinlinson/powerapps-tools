import { spawnSync } from 'node:child_process';

export const install = async (
  packageManager: string,
  packages?: { dependencies?: string[]; devDependencies?: string[] }
): Promise<void> => {
  if (process.env.JEST_WORKER_ID != undefined) {
    return;
  }

  if (packages) {
    if (packages.devDependencies) {
      spawnSync(packageManager, ['add', ...packages.devDependencies, '-D'], { stdio: 'inherit', shell: true });
    }

    if (packages.dependencies) {
      spawnSync(packageManager, ['add', ...packages.dependencies], { stdio: 'inherit', shell: true });
    }
  } else {
    spawnSync(packageManager, ['install'], { stdio: 'inherit', shell: true });
  }
};
