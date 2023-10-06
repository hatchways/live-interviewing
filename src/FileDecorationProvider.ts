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
  badge: any;
  userSocketId: string;

  emitter = new vscode.EventEmitter<vscode.Uri>();

  //  userSocketId: string
  public constructor(globalState: vscode.Memento, socket: Socket, userSocketId: string) {
    this.onDidChangeFileDecorations = this.emitter.event;
    this.globalState = globalState;
    this.socket = socket;
    this.disposable = vscode.window.registerFileDecorationProvider(this);
    this.userSocketId = userSocketId;    
  }

  public setValue(value: any) {
    this.socketFileEventValue = value;
    const files = this.socketFileEventValue?.files;
    for (const file in files){
      // @ts-ignore
      const uri = file["uri"];
      if (this.userSocketId in file["users"]){
        this.emitter.fire(uri);
      }
      if (file["users"]?.length === 0){
        this.emitter.fire(uri);
      }
    }
    this.badge = value["allOnlineUsers"][this.userSocketId]?.name;
    // this.badge = "Anonymous"
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    if (doc != undefined && !doc.isUntitled) {
      // If no users are on a file, the default decoration will be an empty tring;
      let badge = "";
      const files = this.socketFileEventValue?.files;
      if (files[uri.fsPath]["users"]?.length > 0){
       badge = this.badge?.[0];
      }
      result = new vscode.FileDecoration(badge, `${this.badge} is on this file`);
    }
    return result;
  }

  dispose() {
    this.disposable.dispose();
  }
}
