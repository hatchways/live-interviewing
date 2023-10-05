import { Socket } from "socket.io-client";
import * as vscode from "vscode";

export class FileDecorationProvider
  implements vscode.Disposable, vscode.FileDecorationProvider
{
  badge: string;
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
    const files = this.socketFileEventValue?.files;
    for (const file in files){
      // @ts-ignore
      const uri = file["uri"];
      console.log("uri", uri);
      this.emitter.fire(uri);
    }
    this.badge = value["allOnlineUsers"][this.socket.id]?.name;
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    if (doc != undefined && !doc.isUntitled) {
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
