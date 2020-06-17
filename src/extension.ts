import * as vscode from "vscode";
import SimpleGit from "simple-git/promise";
import Yukikaze from "yukikaze";

const git = SimpleGit(vscode.workspace.rootPath ?? process.cwd());
const interval = new Yukikaze();

function startInterval(minutes: number): void {
    interval.run(async () => {
        try {
            const result = await git.diffSummary();
            if (result.changed > 0) {
                vscode.window.showInformationMessage(`Don't forget to commit your new changes | ${result.changed} ${result.changed === 1 ? "file" : "files"} to commit`);
            }
        } catch (err) {
            vscode.window.showErrorMessage(err ? err.toString() : "Error");
        }
    }, 1000 * 60 * minutes);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    const minutes = config.get<number>("commitReminder.interval") ?? 30;

    try {
        const isRepo = await git.checkIsRepo();
        if (isRepo) {
            startInterval(minutes);
        }
    } catch (error) {
        console.error(`vscode-commit-reminder - no git repository found: ${error.name} ${error.message}`);
    }

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("commitReminder.interval")) {
            interval.stop();
            const config = vscode.workspace.getConfiguration();
            const minutes = config.get<number>("commitReminder.interval") ?? 30;
            startInterval(minutes);
        }
    }));
}

export function deactivate(): void {
    interval.stop();
}
