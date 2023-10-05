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
    this.badge = socket.id;
  }

  public setValue(value: any) {
    this.socketFileEventValue = value;
    const files = this.socketFileEventValue?.files;
    for (const file in files){
      const uri = file["uri"];
      console.log("uri", uri);
      this.emitter.fire(uri);
    }
  }

  public removeBadge(value: any){
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;
    // const allOnlineUsers = this.socketFileEventValue["allOnlineUsers"];
    // const userClickedOnFile = this.socketFileEventValue["userPerformingThisAction"];

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    if (doc != undefined && !doc.isUntitled) {
      // const user = allOnlineUsers?.[userClickedOnFile];
      // const badge = user?.name?.[0];
      
      // result = new vscode.FileDecoration(this.badge?.[0], `${this.badge} is on this file`);

      let fakeBadge = "";
      const files = this.socketFileEventValue?.files;
      if (files[uri.fsPath]["users"]?.length > 0){
        fakeBadge = "A";
      } else {
        fakeBadge = "";
      }
      result = new vscode.FileDecoration(fakeBadge, `${fakeBadge} is on this file`);
    }
    return result;
  }

  dispose() {
    this.disposable.dispose();
  }
}
