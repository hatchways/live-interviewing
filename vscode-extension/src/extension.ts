import * as vscode from 'vscode'
import { Sidebar } from './Sidebar'
import { WelcomePanel } from './WelcomePage'

export function activate(context: vscode.ExtensionContext) {
	const provider = new Sidebar(context.extensionUri)

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(Sidebar.viewType, provider))

	vscode.commands.registerCommand(
		'hatchways:openVueApp', () => 
			{
				WelcomePanel.createOrShow(context.extensionUri);
			}
	)
}
