import { Socket } from "socket.io-client";
import * as vscode from "vscode";
import { Map } from "./types/FileDecorationProviderTypes";


export class FileDecorationProvider
  implements vscode.Disposable, vscode.FileDecorationProvider
{
  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;
  globalState: vscode.Memento;
  disposable: vscode.Disposable;  
 
  socket: Socket;
  socketFileEventValue: Map;
  userOnFile: string | undefined;

  emitter = new vscode.EventEmitter<vscode.Uri>();


  public constructor(globalState: vscode.Memento, socket: Socket, value: Map) {
    this.onDidChangeFileDecorations = this.emitter.event;
    this.globalState = globalState;
    this.socket = socket;
    this.disposable = vscode.window.registerFileDecorationProvider(this);

    /**
     * this.emitter.fire only allow us to set a single letter, such as "A" onto a file decoration.
     * Each user's name, such as "John", will be represented as "J".
     * If multiple users are on a file, we need to call `this.emitter.fire` multiple times.
     */
    this.socketFileEventValue = value;
    const files = this.socketFileEventValue?.files;
    for (const filePath in files){
      const uri = files[filePath]["uri"];
      const users = files[filePath]["users"];
      console.log(uri, users);
      for (const user of users){
        this.userOnFile = value["allOnlineUsers"][user]?.name;
        this.emitter.fire(uri);
      }
    }
  }


  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    if (doc != undefined && !doc.isUntitled) {
      let badge = this.userOnFile;
      const files = this.socketFileEventValue?.files;
      if (files[uri.fsPath]["users"]?.length > 0){
       badge = badge?.[0];
      } else {
        // If no users are on a file, the default decoration will be an empty string;
        badge = "";
      }
      result = new vscode.FileDecoration(badge, `${badge} is on this file`);
    }
    return result;
  }

  dispose() {
    // Dispose a FileDecoration when new changes appear.
    this.disposable.dispose();
  }
}
