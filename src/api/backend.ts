import * as vscode from "vscode";
import fetch from "cross-fetch";

import { Utils } from "../utils/utils";

export class Backend {
    containerId: string = "";
    currentProjectUuid: string = "";
    language: number = 0;

    constructor() {
        this.currentProjectUuid = "";
    }

    async startBackend(workSpacePath: string): Promise<void> {
        this.containerId = await Utils.executeShell(`docker run -d -p 1337:80 --name refactor-guidance-tool --rm -v ${workSpacePath}:/app/project isa-lab/refactor-guidance-tool`);

        // wait untill the backend has fully started (so not just the docker container, but also the swagger instance)
        // TODO: do this properly
        await Utils.delay(5000);
    }

    async createProject(workSpacePath: string): Promise<void> {
        await this.startBackend(workSpacePath);

        const response = await fetch(`http://localhost:1337/Project/Project?projectLanguage=${this.language}&projectPath=/app/project`, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });
          
        if (!response.ok) { /* handle this later */}
          
        if (response.body !== null) {
            const responseJson = await response.json();
            this.currentProjectUuid = responseJson["projectUuid"];
        }
    }

    async deleteProject() {
        const response = await fetch(`http://localhost:1337/Project/Project?uuid=${this.currentProjectUuid}`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });
          
        if (!response.ok) { /* handle this later */}
    }

    async createOrUpdateDatabase(): Promise<void> {
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showErrorMessage("You must be inside of a valid workspace before attempting to execute this command!");
            return;
        }
        
        let workSpacePath = vscode.workspace.workspaceFolders[0].uri.path;

        // creating a project also creates the database.
        // so if we already have a project, delete it and add it (to simulate an update)
        // this should probably have a specific endpoint on the backend later to update instead of remove + add

        if (this.currentProjectUuid.length !== 0) {
            await this.deleteProject();
        }

        await this.createProject(workSpacePath);
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
}
