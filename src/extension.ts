import { SidebarProvider } from "./SidebarProvider";
import { WelcomePanel } from "./WelcomePanel";
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


  // Initialize the Welcome page 
  let disposable = vscode.commands.registerCommand(
    "hatchways-live-interviewing.welcome",
    () => {
      WelcomePanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
