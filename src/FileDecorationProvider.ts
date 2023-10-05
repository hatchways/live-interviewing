import { Socket } from "socket.io-client";
import * as vscode from "vscode";

export class FileDecorationProvider
  implements vscode.Disposable, vscode.FileDecorationProvider
{
  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;
  globalState: vscode.Memento;
  disposable: vscode.Disposable;
 
  socket: Socket;
  socketFileEventValue: any;

  emitter = new vscode.EventEmitter<vscode.Uri>();

  public constructor(globalState: vscode.Memento, socket: Socket) {
    this.onDidChangeFileDecorations = this.emitter.event;
    this.globalState = globalState;
    this.socket = socket;
    this.disposable = vscode.window.registerFileDecorationProvider(this);
  }

  public setValue(value: any) {
    this.socketFileEventValue = value;
    this.emitter.fire(value["newFileClicked"]);
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;


    const allOnlineUsers = this.socketFileEventValue["allOnlineUsers"];
    const userClickedOnFile = this.socketFileEventValue["userClickedOnFile"];

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    if (doc != undefined && !doc.isUntitled) {
      const decor = allOnlineUsers?.[userClickedOnFile]?.name?.[0] || "C";
      result = new vscode.FileDecoration(decor, allOnlineUsers?.[userClickedOnFile]?.name);
    }
    return result;
  }

  dispose() {
    this.disposable.dispose();
  }
}
