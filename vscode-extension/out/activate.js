"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const socket_io_client_1 = require("socket.io-client");
const extension_1 = require("./extension");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "hatchways" is now active!');
    // vscode.commands.executeCommand('workbench.action.togglePanel');
    // const folderPath = `/home/workspace/vscode-extension`;
    // const folderUri = vscode.Uri.parse(folderPath);
    // vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
    // vscode.window.showInformationMessage(folderPath);
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from Hatchaways!');
    const config = vscode.workspace.getConfiguration('files');
    config.update('autoSave', 'afterDelay', true);
    config.update('autoSaveDelay', 100, true);
    // Let's determine the workspace folder (assuming a single-root workspace)
    // let workspaceFolders = vscode.workspace.workspaceFolders;
    // console.log(workspaceFolders);
    // if (!workspaceFolders) {
    // 	vscode.window.showErrorMessage('No folder or workspace opened.');
    // 	return;
    // }
    // let currentWorkspacePath = workspaceFolders[0].uri.fsPath;
    // console.log(currentWorkspacePath);
    // // Now, run npm install in that folder
    // exec('npm install', { cwd: currentWorkspacePath }, (error, stdout, stderr) => {
    // 	if (error) {
    // 		console.error(`exec error: ${error}`);
    // 		vscode.window.showErrorMessage(`Error running npm install: ${error.message}`);
    // 		return;
    // 	}
    // 	vscode.window.showInformationMessage(`Ran NPM install ${stdout}`);
    // });
    const treeDataProvider = new extension_1.MyTreeDataProvider();
    const treeView = vscode.window.createTreeView('myTreeView', { treeDataProvider });
    context.subscriptions.push(treeView);
    vscode.commands.executeCommand("myTreeView.focus");
    // // Delay revealing to ensure the UI is ready
    // setTimeout(() => {
    // }, 3000); // Delaying by 1 second. You might need to adjust this.
    const socket = (0, socket_io_client_1.io)('http://localhost:4000');
    // Listen to changes from other users and apply them
    socket.on('cursorMove', (data) => {
        console.log(data);
        let otherUserCursorPosition = data.selections[0].active; // This should be updated from the server.
        const activeEditor = vscode.window.activeTextEditor;
        const cursorDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255,0,0,0.3)',
            border: '2px solid red'
        });
        activeEditor?.setDecorations(cursorDecoration, [{
                range: new vscode.Range(otherUserCursorPosition, otherUserCursorPosition.translate(0, 1))
            }]);
    });
    if (vscode.window.activeTextEditor) {
        context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(event => {
            if (event.textEditor === vscode.window.activeTextEditor) {
                // Send cursor move to the server
                console.log(event.textEditor);
                // todo get open file
                socket.emit('cursorMove', {
                    selections: event.selections
                });
            }
        }));
    }
}
exports.activate = activate;
//# sourceMappingURL=activate.js.map