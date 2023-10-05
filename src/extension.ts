import { FileDecorationProvider } from "./FileDecorationProvider";
import { SidebarProvider } from "./SidebarProvider";
import { ALL_USERS, CURSOR_MOVE, USER_CLICK_ON_FILE } from "./utils/constants";
import { io } from "socket.io-client";
import * as vscode from "vscode";

// This method is called when your extension is activated.
// Currently this is activated as soon as user open VSCode
export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("files");
  config.update("autoSave", "afterDelay", true);
  config.update("autoSaveDelay", 100, true);

  const socket = io("https://8c20-173-33-99-170.ngrok-free.app");

  let currFileDecorationProvider: FileDecorationProvider = null;

  socket.on(ALL_USERS, (value, callback) => {
    const allOnlineUsers = value["allOnlineUsers"];
    const newUserJoined = value["newUserJoined"];
    vscode.window.showInformationMessage(
      `User ${newUserJoined} joined the interview!`
    );
    context.globalState.update(ALL_USERS, allOnlineUsers);
  });

  socket.on(USER_CLICK_ON_FILE, (value, callback) => {
    const allOnlineUsers = value["allOnlineUsers"];
    context.globalState.update(ALL_USERS, allOnlineUsers);

    if (currFileDecorationProvider) {
      currFileDecorationProvider.dispose();
    }
    currFileDecorationProvider = new FileDecorationProvider(
      context.globalState,
      socket
    );
    currFileDecorationProvider.setValue(value);
  });

  // Listen to changes from other users and apply them
  socket.on(CURSOR_MOVE, (data) => {
    // if (uniqueId === data.uniqueId) {
    // 	return
    // }
    let startPosition: vscode.Position = new vscode.Position(
      data.selections[0].start.line,
      data.selections[0].start.character
    );
    let endPosition: vscode.Position = new vscode.Position(
      data.selections[0].end.line,
      data.selections[0].end.character
    );

    const activeEditor = vscode.window.activeTextEditor;
    const cursorDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255,0,0,0.3)", // Red color for demonstration. Adjust as needed.
      border: "2px solid red",
    });

    if (data.filePath !== activeEditor?.document.uri.path) {
      vscode.window.showTextDocument(vscode.Uri.file(data.filePath), {
        viewColumn: vscode.ViewColumn.One,
      });
    }

    activeEditor?.setDecorations(cursorDecoration, [
      {
        range: new vscode.Range(startPosition, endPosition),
      },
    ]);
  });

  // Initialize the Sidebar
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    context.globalState,
    socket
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "hatchways-sidebar",
      sidebarProvider
    )
  );

  // Initialize Walkthrough Screen
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "hatchways-live-interviewing.welcome",
      () => {
        vscode.commands.executeCommand(
          `workbench.action.openWalkthrough`,
          `hatchways.hatchways-live-interviewing#walkthrough`,
          false
        );
      }
    )
  );

  // Automatically open Live Interview + Sidebar
  vscode.commands.executeCommand("hatchways-live-interviewing.welcome");
  vscode.commands.executeCommand("hatchways-sidebar.focus");

  // When user click on a file, send it to Socket
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      const doc = editor?.document;
      if (doc?.uri) {
        socket.emit(USER_CLICK_ON_FILE, doc?.uri);
      }
    })
  );

  if (vscode.window.activeTextEditor) {
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor === vscode.window.activeTextEditor) {
          socket.emit(CURSOR_MOVE, {
            selections: event.selections,
            socketId: socket.id,
            filePath: event.textEditor.document.uri.path,
          });
        }
      })
    );
  }
}
// This method is called when your extension is deactivated
export function deactivate() {}
