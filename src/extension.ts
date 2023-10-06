import { FileDecorationProvider } from "./FileDecorationProvider";
import { SidebarProvider } from "./SidebarProvider";
import {
  SOCKET_URL,
  USER_READY,
  FILE_CLICK,
  CURSOR_MOVE,
  DISCONNECT,
  JOIN_SESSION,
} from "./utils/constants";
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
  const workspace = vscode.workspace.workspaceFolders?.[0];
  const sessionId = workspace?.name || "";

  const socket = io(SOCKET_URL);
  socket.emit(JOIN_SESSION, sessionId);

  // Sidebar
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    sessionId,
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

  // When user submitted their name
  socket.on(USER_READY, (message) => {
    vscode.window.showInformationMessage(message);
  });

  // When user left
  socket.on(DISCONNECT, (message) => {
    vscode.window.showInformationMessage(message);
  });

  // When user open a file
  let disposableCurrFileDecorationProviders: any = [];
  socket.on(FILE_CLICK, (value) => {
    for (const d of disposableCurrFileDecorationProviders) {
      d.dispose();
    }

    // For each online user, register a FileDecorationProvider
    disposableCurrFileDecorationProviders = [];
    for (const userId in value["allOnlineUsers"]) {
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
  socket.on(
    CURSOR_MOVE,
    ({ userPerformingThisAction, cursorPosition, allOnlineUsers }) => {
      // Remove previous cursor because the user is moving onto a new file now.
      if (userPerformingThisAction in disposableCursorDecorations) {
        disposableCursorDecorations[userPerformingThisAction].dispose();
      }

      let startPosition: vscode.Position = new vscode.Position(
        cursorPosition["startLine"],
        cursorPosition["startCharacter"]
      );
      let endPosition: vscode.Position = new vscode.Position(
        cursorPosition["endLine"],
        cursorPosition["endCharacter"]
      );

      const user = allOnlineUsers[userPerformingThisAction];
      const { r, g, b } = user?.color;
      const hex =
        "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

      const activeEditor = vscode.window.activeTextEditor;
      const cursorDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
        border: `2px solid ${hex}`,
      });

      if (cursorPosition["filePath"] !== activeEditor?.document.uri.path) {
        vscode.window.showTextDocument(
          vscode.Uri.file(cursorPosition["filePath"]),
          {
            viewColumn: vscode.ViewColumn.One,
          }
        );
      }

      activeEditor?.setDecorations(cursorDecoration, [
        {
          hoverMessage: user?.name,
          range: new vscode.Range(startPosition, endPosition),
        },
      ]);

      disposableCursorDecorations[userPerformingThisAction] = cursorDecoration;
    }
  );

  // When user click on a file, send it to Socket
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      const doc = editor?.document;
      if (doc?.uri) {
        socket.emit(FILE_CLICK, { sessionId, fileUri: doc?.uri });
      }
    })
  );

  if (vscode.window.activeTextEditor) {
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        // Send new cursor position
        if (event.textEditor === vscode.window.activeTextEditor) {
          socket.emit(CURSOR_MOVE, {
            sessionId,
            cursorPosition: {
              startLine: event.selections[0].start.line,
              startCharacter: event.selections[0].start.character,
              endLine: event.selections[0].end.line,
              endCharacter: event.selections[0].end.character,
              filePath: event.textEditor.document.uri.path,
            },
          });
        }
      })
    );
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
