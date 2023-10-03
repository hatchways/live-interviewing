import { SidebarProvider } from "./SidebarProvider";
import { io } from 'socket.io-client';
import * as vscode from "vscode";
import { FileDecorationProvider } from "./FileDecorationProvider";
import { USER_JOIN } from "./utils/globalStateKey";


// This method is called when your extension is activated. 
// Currently this is activated as soon as user open VSCode
export function activate(context: vscode.ExtensionContext) {
  const socket = io('http://localhost:4000');

  socket.on('test', (value) => {
    vscode.window.showInformationMessage(value);
  });
  
  socket.on(USER_JOIN, (value, callback) => {
     console.log("vallue is calld in here?????")
			vscode.window.showInformationMessage(value);
	});

	  
  // Initialize the Sidebar
  const sidebarProvider = new SidebarProvider(context.extensionUri, context.globalState, socket);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "hatchways-sidebar",
      sidebarProvider
    )
  );

  // Initialize Walkthrough Screen
  context.subscriptions.push(
    vscode.commands.registerCommand("hatchways-live-interviewing.welcome", () => {
      vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `hatchways.hatchways-live-interviewing#walkthrough`, false);
    })
  )

  // Automatically open Live Interview + Sidebar 
  vscode.commands.executeCommand("hatchways-live-interviewing.welcome");
  vscode.commands.executeCommand("hatchways-sidebar.focus")

  const currentUser = context.globalState.get("currentUser");

  const fileDecorationProvider = new FileDecorationProvider("M");
  vscode.window.registerFileDecorationProvider(fileDecorationProvider)

  // When user click on a file, send it to Socket
   context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
    const doc = editor?.document;
    // if (doc?.uri){
    //   fileDecorationProvider.emitter.fire(doc?.uri);
    // }
  }));
  
}
// This method is called when your extension is deactivated
export function deactivate() {}
 