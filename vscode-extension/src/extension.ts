// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { io } from 'socket.io-client';

class MyTreeItem extends vscode.TreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
    }
}

class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | null | void> = new vscode.EventEmitter<MyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

	getFirstItem(): MyTreeItem {
		return new MyTreeItem('Hello', vscode.TreeItemCollapsibleState.None);
	}

    getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (!element) {
            return Promise.resolve([
                new MyTreeItem('Hello', vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
	
		const uniqueId = Math.floor(Math.random() * 100);

		const treeDataProvider = new MyTreeDataProvider();
    	const treeView = vscode.window.createTreeView('myTreeView', { treeDataProvider });
		context.subscriptions.push(treeView);
		vscode.commands.executeCommand("myTreeView.focus");

		// // Delay revealing to ensure the UI is ready
		// setTimeout(() => {
		// }, 3000); // Delaying by 1 second. You might need to adjust this.
		const socket = io('http://localhost:4000');

		socket.on('test', () => {
			vscode.window.showInformationMessage('Connect to interview!');
		});

		// Listen to changes from other users and apply them
		socket.on('cursorMove', (data: any) => {
			vscode.window.showInformationMessage(data.uniqueId);
			// if (uniqueId === data.uniqueId) {
			// 	return				
			// }
			let startPosition: vscode.Position = new vscode.Position(data.selections[0].start.line, data.selections[0].start.character);
			let endPosition: vscode.Position = new vscode.Position(data.selections[0].end.line, data.selections[0].end.character);
			
			const activeEditor = vscode.window.activeTextEditor;
			const cursorDecoration = vscode.window.createTextEditorDecorationType({
				backgroundColor: 'rgba(255,0,0,0.3)',  // Red color for demonstration. Adjust as needed.
				border: '2px solid red'
			});

			if (data.filePath !== activeEditor?.document.uri.path) {
				vscode.window.showTextDocument(vscode.Uri.file(data.filePath), { viewColumn: vscode.ViewColumn.One });
			}

			activeEditor?.setDecorations(cursorDecoration, [{
				range: new vscode.Range(startPosition, endPosition)
			}]);
		});

		if (vscode.window.activeTextEditor) {
			context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(event => {
				if (event.textEditor === vscode.window.activeTextEditor) {
					// Send cursor move to the server
					console.log(event.textEditor);
					// todo get open file
					socket.emit('cursorMove', {
						selections: event.selections,
						uniqueId,
						filePath: event.textEditor.document.uri.path
					});
				}
			}));
		}

}

// This method is called when your extension is deactivated
export function deactivate() {}
