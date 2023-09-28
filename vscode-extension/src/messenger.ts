import * as vscode from 'vscode'

export const handleMessages = (webview: vscode.Webview) => {
	receiveMessages(webview)

	sendMessages(webview)
}

const receiveMessages = (webview: vscode.Webview) => {
	webview.onDidReceiveMessage(async (message) => {
		let openPath: vscode.Uri

		switch (message.command) {
		case 'openFileExample':
			vscode.window.showInformationMessage(message.text)
			return
		}
	})
}

const sendMessages = (webview: vscode.Webview) => {
	// vscode.window.onDidChangeActiveTextEditor(async (editor) => {
	// 	if (!editor) return

	// 	const currentFile = editor.document.fileName

	// 	await webview.postMessage({
	// 		command: 'setCurrentFileExample',
	// 		text: currentFile
	// 	})
	// })
}
