import { SidebarProvider } from "./SidebarProvider";
import { WelcomePanel } from "./WelcomePanel";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "hatchways-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("hatchways.welcome", async () => {
      // Open Welcome command
      WelcomePanel.createOrShow(context.extensionUri);

      // Open Sidebar view
      await vscode.commands.executeCommand(
        "workbench.view.extension.hatchways-sidebar-view"
      );
    })
  );
}
