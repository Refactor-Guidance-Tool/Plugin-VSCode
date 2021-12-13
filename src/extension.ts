import * as vscode from "vscode";

import {
	Backend,
} from "./api/backend";

const backend: Backend = new Backend();

function createDatabaseCallback() {
	const quickPick = vscode.window.createQuickPick();
	const languages = ["C#", "Java"];

	quickPick.items = languages.map((label) => ({
		label,
	}));
	quickPick.onDidChangeSelection(([{ label,
	}]) => {
		quickPick.hide();

		backend.setLanguage(languages.indexOf(label));
		backend.createOrUpdateDatabase();
	});

	quickPick.show();
}

function openDashboardCallback() {
	const currentProjectUuid = backend.getCurrentProjectUuid();
	if (currentProjectUuid.length === 0) {
		vscode.window.showErrorMessage("You haven't created a database yet! First create a database for the current project.");
		return;
	}

	vscode.env.openExternal(vscode.Uri.parse(`http://localhost:3000/start?projectUuid=${currentProjectUuid}`));
}

const commands = [{
	command: "refactor-guidance-tool-vscode-plugin.create-database",
	callback: createDatabaseCallback,
},
{
	command: "refactor-guidance-tool-vscode-plugin.open-dashboard",
	callback: openDashboardCallback,
},
];

export function activate(context: vscode.ExtensionContext) {
	commands.forEach((e) => {
		const disposable = vscode.commands.registerCommand(e.command, e.callback);
		context.subscriptions.push(disposable);
	});
}

export async function deactivate() {
	await backend.cleanup();
}
