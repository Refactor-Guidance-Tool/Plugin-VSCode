import * as vscode from "vscode";

import { Backend } from "./api/backend";

const backend: Backend = new Backend();

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('refactor-guidance-tool-vscode-plugin.create-database', () => {
		const quickPick = vscode.window.createQuickPick();
		const languages = ["C#", "Java"];

  		quickPick.items = languages.map(label => ({label}));
  		quickPick.onDidChangeSelection(([{label}]) => {
			quickPick.hide();

    		backend.setLanguage(languages.indexOf(label));
			backend.createOrUpdateDatabase();
  		});

  		quickPick.show();
	});

	context.subscriptions.push(disposable);
}

export async function deactivate() {
	await backend.cleanup();
}
