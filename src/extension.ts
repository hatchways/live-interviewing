import { SidebarProvider } from "./SidebarProvider";
import { io } from 'socket.io-client';
import * as vscode from "vscode";
import { FileDecorationProvider } from "./FileDecorationProvider";
import { ALL_USERS, CURRENT_USER, USER_CLICK_ON_FILE, USER_JOIN } from "./utils/constants";


// This method is called when your extension is activated. 
// Currently this is activated as soon as user open VSCode
export function activate(context: vscode.ExtensionContext) {
  const socket = io('https://23f1-99-209-53-204.ngrok-free.app');

  socket.on("all_users", (value, callback) => {
    const allOnlineUsers = value["allOnlineUsers"];
    const newUserJoined = value["newUserJoined"];
    vscode.window.showInformationMessage(`User ${newUserJoined} joined the interview!`)
    context.globalState.update(ALL_USERS, allOnlineUsers)
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

  const fileDecorationProvider = new FileDecorationProvider(context.globalState, socket);
  vscode.window.registerFileDecorationProvider(fileDecorationProvider)

  // When user click on a file, send it to Socket
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
    const doc = editor?.document;
    if (doc?.uri){
      fileDecorationProvider.emitter.fire(doc?.uri);
    }
  }));
  
}
// This method is called when your extension is deactivated
export function deactivate() {}
 