import { Socket } from "socket.io-client";
import * as vscode from "vscode";
import { Map } from "./types/FileDecorationProviderTypes";


export class FileDecorationProvider
  implements vscode.Disposable, vscode.FileDecorationProvider
{
  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;
  disposable: vscode.Disposable;  
 
  socket: Socket;
  socketFileEventValue: Map;
  userOnFile: string | undefined;

  emitter = new vscode.EventEmitter<vscode.Uri>();

  public constructor(socket: Socket, value: Map, user: any) {
    this.onDidChangeFileDecorations = this.emitter.event;
    this.socket = socket;
    this.disposable = vscode.window.registerFileDecorationProvider(this);
    this.userOnFile = user;

    /**
     * this.emitter.fire only allow us to set a single letter, such as "A" onto a file decoration.
     * Each user's name, such as "John", will be represented as "J".
     * If multiple users are on a file, we need to call `this.emitter.fire` multiple times.
     */
    this.socketFileEventValue = value;
    const files = this.socketFileEventValue?.files;
    for (const filePath in files){
      const uri = files[filePath]["uri"];
      this.emitter.fire(uri);
    }
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;
    const files = this.socketFileEventValue?.files;
    const users = files[uri.fsPath]["users"];
    
    // User is not on the file
    if (this.userOnFile && !(users.includes(this.userOnFile))){
      return result;
    }

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    const activeEditor = vscode.window.activeTextEditor;
    const pathBeingViewed = activeEditor ? activeEditor.document.uri.path : null;

    let badge = this.userOnFile;
    
    if (doc != undefined && !doc.isUntitled) {
      if (this.userOnFile === this.socket.id){

        if (pathBeingViewed === doc.fileName){
          result = new vscode.FileDecoration(badge?.[0], `${badge} is on this file`);
        }
      } else {
        result = new vscode.FileDecoration(badge?.[0], `${badge} is on this file`);
      }
    }
    return result;
  }

  dispose() {
    // Dispose a FileDecoration when new changes appear.
    this.disposable.dispose();
  }
}
