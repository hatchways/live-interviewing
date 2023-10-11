import { FileDecorationProvider } from "./FileDecorationProvider";
import { SidebarProvider } from "./SidebarProvider";
import { filesManager, stateManager } from "./context";
import { Map } from "./types/extensionTypes";
import {
  SOCKET_URL,
  USER_READY,
  FILE_CLICK,
  CURSOR_MOVE,
  USER_LEAVE,
  CURRENT_POSITION,
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

  const workspace = vscode.workspace.workspaceFolders?.[0];
  const sessionId = workspace?.name || "";

  const socket = io(SOCKET_URL);

  const { get, setUser, removeUser } = stateManager(context);
  const { setFile, removeUserFromFile } = filesManager(context);

  // The key is the user's socket id, the value is their file and cursor positions.
  let disposableCurrFileDecorationProviders: Map = {};
  let disposableCursorDecorations: Map = {};

  // Sidebar
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    sessionId,
    socket,
    context
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

  // When a new user joined the interview
  socket.on(USER_READY, async ({ id, name, color }) => {
    const onlineUsers = get();
    vscode.window.showInformationMessage(
      `${name} has joined the coding interview session.`
    );
    if (socket.id in onlineUsers && id !== socket.id) {
      const myData = onlineUsers[socket.id];
      const { name, currentPosition, filePosition } = myData;
      socket.emit(CURRENT_POSITION, {
        sessionId,
        name,
        currentPosition,
        fileUri: filePosition,
      });
    }
    await setUser(id, { name, color });
  });

  // After a user joins an interview, the other pre-existing users emit data to the newly joined user.
  socket.on(CURRENT_POSITION, async ({ id, name, fileUri, cursorPosition }) => {
    const onlineUsers = get();
    if (!(id in onlineUsers)) {
      vscode.window.showInformationMessage(
        `${name} has joined the coding interview session.`
      );
      await setUser(id, { filePosition: fileUri, cursorPosition, name });
      await setFile(id, fileUri);
      modifyFileDecorator(id, fileUri, null);
      modifyCursor(id, cursorPosition);
    }
  });

  // When user open a file
  socket.on(FILE_CLICK, async ({ id, fileUri }) => {
    const onlineUsers = get();

    if (!(id in onlineUsers)) {
      return;
    }

    const previousUri = onlineUsers[id]?.filePosition;
    if (previousUri && previousUri?.fsPath) {
      await removeUserFromFile(id, previousUri);
    }
    await setUser(id, { filePosition: fileUri });
    await setFile(id, fileUri);

    modifyFileDecorator(id, fileUri, previousUri);
  });

  // When user moves their cursor
  socket.on(CURSOR_MOVE, ({ id, cursorPosition }) => {
    modifyCursor(id, cursorPosition);
  });

  // When user left
  socket.on(USER_LEAVE, async ({ id }) => {
    const onlineUsers = get();
    const name = onlineUsers[id]?.name;
    const uri = onlineUsers[id]?.filePosition;
    vscode.window.showInformationMessage(
      `${name} has left the coding interview session.`
    );

    if (id in disposableCurrFileDecorationProviders) {
      disposableCurrFileDecorationProviders[id].removeFiles(uri);
      disposableCurrFileDecorationProviders[id].dispose();
    }
    if (id in disposableCursorDecorations) {
      disposableCursorDecorations[id].dispose();
    }

    await removeUser(id);
    await removeUserFromFile(id, uri);
  });

  // When user click on a file, send it to Socket
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      const onlineUsers = get();
      const doc = editor?.document;
      if (doc?.uri) {
        setUser(socket.id, { filePosition: doc?.uri });
        socket.emit(FILE_CLICK, { sessionId, fileUri: doc?.uri });

        const previousUri = onlineUsers[socket?.id]?.filePosition;
        modifyFileDecorator(socket.id, doc?.uri, previousUri);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const cursorPosition = {
        startLine: event.selections[0].start.line,
        startCharacter: event.selections[0].start.character,
        endLine: event.selections[0].end.line,
        endCharacter: event.selections[0].end.character,
        filePath: event.textEditor.document.uri.path,
      };
      setUser(socket.id, { cursorPosition });

      // Send new cursor position
      socket.emit(CURSOR_MOVE, {
        sessionId,
        cursorPosition,
      });
    })
  );

  // Function to modify file decoration
  const modifyFileDecorator = async (
    id: string,
    fileUri: vscode.Uri,
    previousUri: vscode.Uri | null
  ) => {
    if (!fileUri) {
      return;
    }

    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == fileUri.toString()
    );
    if (!doc && id !== socket.id) {
      vscode.window.showTextDocument(vscode.Uri.file(fileUri.path));
    }
    const onlineUsers = get();

    if (id in disposableCurrFileDecorationProviders) {
      disposableCurrFileDecorationProviders[id].updateFiles(fileUri);
      disposableCurrFileDecorationProviders[id].removeFiles(previousUri);
    } else {
      const currFileDecorationProvider = new FileDecorationProvider(
        socket,
        id,
        onlineUsers?.[id]?.name
      );
      currFileDecorationProvider.updateFiles(fileUri);
      disposableCurrFileDecorationProviders[id] = currFileDecorationProvider;
    }
  };

  const modifyCursor = (id: string, cursorPosition: Map) => {
    const onlineUsers = get();

    // Remove previous cursor because the user is moving onto a new file now.
    if (id in disposableCursorDecorations) {
      disposableCursorDecorations[id].dispose();
    }

    let startPosition: vscode.Position = new vscode.Position(
      cursorPosition["startLine"],
      cursorPosition["startCharacter"]
    );
    let endPosition: vscode.Position = new vscode.Position(
      cursorPosition["endLine"],
      cursorPosition["endCharacter"]
    );

    const user = onlineUsers[id];
    const { r, g, b } = user?.color;
    const hex =
      "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

    const activeEditor = vscode.window.activeTextEditor;
    const cursorDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
      border: `2px solid ${hex}`,
    });

    activeEditor?.setDecorations(cursorDecoration, [
      {
        hoverMessage: user?.name,
        range: new vscode.Range(startPosition, endPosition),
      },
    ]);

    disposableCursorDecorations[id] = cursorDecoration;
  };
}

// This method is called when your extension is deactivated
export function deactivate() {}
