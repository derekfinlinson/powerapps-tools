// @ts-nocheck
import inquirer from 'inquirer';

export default class RecursivePrompt {
  question: { message: string; prompts?: unknown[] };

  constructor(question: { message: string; prompts?: unknown[] }) {
    this.question = question;
  }

  async run() {
    const results: Record<string, unknown>[] = [];

    // Match previous recursive behavior: ask whether to add an entry, then repeat until false.
    let shouldContinue = true;
    while (shouldContinue) {
      const { addEntry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addEntry',
          message: this.question.message,
          default: false
        }
      ]);

      shouldContinue = addEntry;
      if (!shouldContinue) {
        break;
      }

      const entry = await inquirer.prompt(this.question.prompts ?? []);
      results.push(entry);
    }

    return results;
  }
}
