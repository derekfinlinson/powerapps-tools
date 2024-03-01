import { exec } from 'node:child_process';

export default function getGitBranch(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('git branch --show-current', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      resolve(stdout.trim());
    });
  });
}
