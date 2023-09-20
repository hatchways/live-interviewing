"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process_1 = require("child_process");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "hatchways" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from Hatchways!');
    // Let's determine the workspace folder (assuming a single-root workspace)
    let workspaceFolders = vscode.workspace.workspaceFolders;
    console.log(workspaceFolders);
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No folder or workspace opened.');
        return;
    }
    let currentWorkspacePath = workspaceFolders[0].uri.fsPath;
    console.log(currentWorkspacePath);
    // Now, run npm install in that folder
    (0, child_process_1.exec)('npm install', { cwd: currentWorkspacePath }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            vscode.window.showErrorMessage(`Error running npm install: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage(`Ran NPM install ${stdout}`);
    });
    vscode.window.createWebviewPanel('myTerminal', 'My Terminal', vscode.ViewColumn.One);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map