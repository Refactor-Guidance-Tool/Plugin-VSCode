import * as vscode from "vscode";
import fetch from "cross-fetch";

import { Utils } from "../utils/utils";

export class Backend {
	port = 1337;
	containerId = "";
	currentProjectUuid = "";
	currentWorkspacePath = "";
	language = 0;

	constructor() { 
		this.port = 1337;
		this.containerId = "";
		this.currentProjectUuid = "";
		this.language = 0;
	}

	async startBackend(workSpacePath: string): Promise<void> {
		vscode.window.showInformationMessage("Starting docker instance for backend...");

		this.containerId = await Utils.executeShell(`docker run -d -p ${this.port}:80 --name refactor-guidance-tool --rm -v ${workSpacePath}:/app/project isa-lab/refactor-guidance-tool`);

		// wait untill the backend has fully started (so not just the docker container, but also the swagger instance)
		let didBackendStart = false;
		while (!didBackendStart) {
			await Utils.timeout(100, fetch(`http://localhost:${this.port}`)).then(() => {
				didBackendStart = true;
				// eslint-disable-next-line @typescript-eslint/no-empty-function
			}).catch(() => { });
		}

		this.currentWorkspacePath = workSpacePath;
	}

	async createProject(workSpacePath: string): Promise<void> {
		if (this.containerId !== "" && workSpacePath != this.currentWorkspacePath) {
			this.cleanup();
			this.containerId = "";
		}

		if (this.containerId === "") {
			await this.startBackend(workSpacePath);
		}
		
		vscode.window.showInformationMessage(`Creating/updating database for project: ${workSpacePath}`);

		const response = await fetch(`http://localhost:${this.port}/Projects/?projectLanguage=${this.language}&projectPath=/app/project`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
		});

		if (!response.ok) { /* handle this later */ }

		if (response.body !== null) {
			const responseJson = await response.json();
			this.currentProjectUuid = responseJson.projectUuid;
		}
	}

	async deleteProject() {
		const response = await fetch(`http://localhost:${this.port}/Projects/${this.currentProjectUuid}`, {
			method: "DELETE",
			headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
		});

		if (!response.ok) { /* handle this later */ }
	}

	async createOrUpdateDatabase(): Promise<void> {
		if (vscode.workspace.workspaceFolders === undefined) {
			vscode.window.showErrorMessage("You must be inside of a valid workspace before attempting to execute this command!");
			return;
		}

		const workSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
	
		// creating a project also creates the database.
		// so if we already have a project, delete it and add it (to simulate an update)
		// this should probably have a specific endpoint on the backend later to update instead of remove + add

		if (this.currentProjectUuid.length !== 0) {
			await this.deleteProject();
		}

		await this.createProject(workSpacePath);
		vscode.window.showInformationMessage("Succesfully created/updated database. You can now open the dashboard and start refactoring!");
	}

	setLanguage(language: number): void {
		this.language = language;
	}

	// for now this stops the docker container if it was running
	async cleanup() {
		if (this.containerId.length === 0) {
			return;
		}

		await Utils.executeShell(`docker kill ${this.containerId}`);
	}

	getCurrentProjectUuid(): string {
		return this.currentProjectUuid;
	}
}
