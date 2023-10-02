import { SidebarProvider } from "./SidebarProvider";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


  // Initialize the Sidebar
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "hatchways-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("hatchways-live-interviewing.welcome", () => {
      vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `hatchways.hatchways-live-interviewing#walkthrough`, false);
    })
  )

  vscode.commands.executeCommand("hatchways-live-interviewing.welcome");
  
}

// This method is called when your extension is deactivated
export function deactivate() {}
 