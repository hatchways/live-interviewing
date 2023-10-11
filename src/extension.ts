import { FileDecorationProvider } from "./FileDecorationProvider";
import { SidebarProvider } from "./SidebarProvider";
import { filesManager, stateManager } from "./context";
import {
  SOCKET_URL,
  USER_READY,
  FILE_CLICK,
  CURSOR_MOVE,
  DISCONNECT,
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

  // Initialize variables
  const workspace = vscode.workspace.workspaceFolders?.[0];
  const sessionId = workspace?.name || "";

  const socket = io(SOCKET_URL);

  const { get, setUser, removeUser } = stateManager(context);
  const { getFiles, setFile, removeUserFromFile } = filesManager(context);

  let disposableCurrFileDecorationProviders: any = {};
  

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
  socket.on(USER_READY, async ({ id, name, color}) => {
    const onlineUsers = get();
    vscode.window.showInformationMessage(`${name} has joined the coding interview session.`);
    if (socket.id in onlineUsers && id !== socket.id){
      const myData = onlineUsers[socket.id];
      const { name, currentPosition, filePosition } = myData
      socket.emit(CURRENT_POSITION, { sessionId, name, currentPosition, fileUri: filePosition})
    }
    await setUser(id, {name, color}); 
  });

  // When current user received other user's data
  socket.on(CURRENT_POSITION, async ({ id, name, fileUri, cursorPosition }) => {
    const onlineUsers = get();
    if (!(id in onlineUsers)){
      vscode.window.showInformationMessage(`${name} has joined the coding interview session at ${fileUri.fsPath}.`);
      await setUser(id, {filePosition: fileUri, cursorPosition, name}); 
      await setFile(id, fileUri);
      modifyFileDecorator(id, fileUri, null);
    }
    vscode.window.showInformationMessage(`Set file position for ${name}`);
  });


  // When user open a file
  socket.on(FILE_CLICK, async ({id, fileUri}) => {
    const onlineUsers = get();

    if (!(id in onlineUsers)){
      vscode.window.showInformationMessage(`No id found in online users ${id}`);
      return;
    }
  
    const previousUri = onlineUsers[id]?.filePosition;
    if (previousUri && previousUri?.fsPath){
      vscode.window.showInformationMessage(`Previous file ${previousUri?.fsPath} removed!!!`);
      await removeUserFromFile(id, previousUri);
    }
    await setUser(id, {filePosition: fileUri}); 
    await setFile(id, fileUri);

    modifyFileDecorator(id, fileUri, previousUri);
  });

  // When user click on a line
  // let disposableCursorDecorations: any = {};
  // socket.on(CURSOR_MOVE, (data) => {
  //   const { userPerformingThisAction, cursorPosition, allOnlineUsers } = data;

  //   // Remove previous cursor because the user is moving onto a new file now.
  //   if (userPerformingThisAction in disposableCursorDecorations) {
  //     disposableCursorDecorations[userPerformingThisAction].dispose();
  //   }

  //   let startPosition: vscode.Position = new vscode.Position(
  //     cursorPosition["startLine"],
  //     cursorPosition["startCharacter"]
  //   );
  //   let endPosition: vscode.Position = new vscode.Position(
  //     cursorPosition["endLine"],
  //     cursorPosition["endCharacter"]
  //   );

  //   const user = allOnlineUsers[userPerformingThisAction];
  //   const { r, g, b } = user?.color;
  //   const hex =
  //     "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

  //   const activeEditor = vscode.window.activeTextEditor;
  //   const cursorDecoration = vscode.window.createTextEditorDecorationType({
  //     backgroundColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
  //     border: `2px solid ${hex}`,
  //   });

  //   if (cursorPosition["filePath"] !== activeEditor?.document.uri.path) {
  //     vscode.window.showTextDocument(
  //       vscode.Uri.file(cursorPosition["filePath"]),
  //       {
  //         viewColumn: vscode.ViewColumn.One,
  //       }
  //     );
  //   }

  //   activeEditor?.setDecorations(cursorDecoration, [
  //     {
  //       hoverMessage: user?.name,
  //       range: new vscode.Range(startPosition, endPosition),
  //     },
  //   ]);

  //   disposableCursorDecorations[userPerformingThisAction] = cursorDecoration;
  // });

  // When user left
  socket.on(DISCONNECT, async({ id }) => {
    const onlineUsers = get();
    const name = onlineUsers[id]?.name;
    const uri = onlineUsers[id]?.filePosition;
    vscode.window.showInformationMessage(`${name} has left the coding interview session.`);

    await removeUser(id);
    await removeUserFromFile(id, uri)
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
      }
      setUser(socket.id, { cursorPosition })

      // Send new cursor position
      socket.emit(CURSOR_MOVE, {
        sessionId,
        cursorPosition
      });
    })
  );

  // Function to modify file decoration
  const modifyFileDecorator = async (id: string, fileUri: vscode.Uri, previousUri: vscode.Uri | null) => {
    if (!fileUri){
      return;
    }

    console.log(`calling modifyDecorator for ${id} and ${fileUri?.fsPath}`)
    const onlineUsers = get();
  
    if (id in disposableCurrFileDecorationProviders){
      disposableCurrFileDecorationProviders[id].dispose();
    }
  
    const currFileDecorationProvider = new FileDecorationProvider(
      socket,
      id,
      fileUri,
      // @ts-ignore
      previousUri,
      onlineUsers?.[id]?.name
    );
  
    disposableCurrFileDecorationProviders[id] = currFileDecorationProvider;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}



