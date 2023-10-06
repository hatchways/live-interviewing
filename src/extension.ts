import { FileDecorationProvider } from "./FileDecorationProvider";
import { SidebarProvider } from "./SidebarProvider";
import { ALL_USERS, SOCKET_URL, USER_CLICK_ON_FILE, USER_CURSOR_MOVE, USER_JOIN, USER_LEAVE } from "./utils/constants";
import { io } from "socket.io-client";
import * as vscode from "vscode";

// This method is called when your extension is activated.
// Currently this is activated as soon as user open VSCode
export function activate(context: vscode.ExtensionContext) {

  // Autosave
  const config = vscode.workspace.getConfiguration("files");
  config.update("autoSave", "afterDelay", true);
  config.update("autoSaveDelay", 100, true);

  // Initialize variables
  const socket = io(SOCKET_URL);

  // Sidebar
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

  // Walkthrough Screen
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
  

  // Update all users state
  socket.on(ALL_USERS, (value, callback) => {
    updateUserState(value, context);
  });

  // When user joined 
  socket.on(USER_JOIN, (message) => {
    vscode.window.showInformationMessage(message)
  })

  // Whe user left
  socket.on(USER_LEAVE, (message) => {
    vscode.window.showInformationMessage(message)
  })

  // When user open a file
  let disposableCurrFileDecorationProviders: any = [];
  socket.on(USER_CLICK_ON_FILE, (value, callback) => {
    updateUserState(value, context);
    for (const d of disposableCurrFileDecorationProviders){
      d.dispose();
    }

    disposableCurrFileDecorationProviders = [];
    // For each online user, register a FileDecorationProvider
    for (const userId in value["allOnlineUsers"]){
      const currFileDecorationProvider = new FileDecorationProvider(
        socket,
        value,
        userId
      );
      disposableCurrFileDecorationProviders.push(currFileDecorationProvider);
    }
  });

  // When user click on a line
  let disposableCursorDecorations: any = {};
  socket.on(USER_CURSOR_MOVE, (value) => {
    updateUserState(value, context);

    const userPerformingThisAction = value["userPerformingThisAction"];
    if (userPerformingThisAction === socket.id) {
    	return
    }

    // Remove previous cursor because the user is moving onto a new file now.
    if (userPerformingThisAction in disposableCursorDecorations){
      disposableCursorDecorations[userPerformingThisAction].dispose();
    }

    const data = value["newCursorPosition"];
    let startPosition: vscode.Position = new vscode.Position(
      data.selections[0].start.line,
      data.selections[0].start.character
    );
    let endPosition: vscode.Position = new vscode.Position(
      data.selections[0].end.line,
      data.selections[0].end.character
    );

    const user = value["allOnlineUsers"][userPerformingThisAction];
    const { r, g, b } = user?.color;
    const hex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);

    const activeEditor = vscode.window.activeTextEditor;
    const cursorDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
      border: `2px solid ${hex}`,
    });

    if (data.filePath !== activeEditor?.document.uri.path) {
      vscode.window.showTextDocument(vscode.Uri.file(data.filePath), {
        viewColumn: vscode.ViewColumn.One,
      });
    }

    activeEditor?.setDecorations(cursorDecoration, [
      {
        hoverMessage: user?.name,
        range: new vscode.Range(startPosition, endPosition),
      },
    ]);

    disposableCursorDecorations[userPerformingThisAction] = cursorDecoration; 
  });


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
        // Send new cursor position
        if (event.textEditor === vscode.window.activeTextEditor) {
          // socket.emit(USER_CLICK_ON_FILE, event.textEditor.document.uri);
          socket.emit(USER_CURSOR_MOVE, {
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

function updateUserState(value: any, context: any){
  const allOnlineUsers = value["allOnlineUsers"];
  context.globalState.update(ALL_USERS, allOnlineUsers);
}