"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const SidebarProvider_1 = require("./SidebarProvider");
const WelcomePanel_1 = require("./WelcomePanel");
const vscode = require("vscode");
function activate(context) {
    const sidebarProvider = new SidebarProvider_1.SidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("hatchways-sidebar", sidebarProvider));
    context.subscriptions.push(vscode.commands.registerCommand("hatchways.welcome", async () => {
        // Open Welcome command
        WelcomePanel_1.WelcomePanel.createOrShow(context.extensionUri);
        // Open Sidebar view
        await vscode.commands.executeCommand("workbench.view.extension.hatchways-sidebar-view");
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map