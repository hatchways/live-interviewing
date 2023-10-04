import * as vscode from "vscode";
import { ALL_USERS, CURRENT_USER, USER_CLICK_ON_FILE } from "./utils/constants";
// import { makeDeepCopy } from "./utils/makeDeepCopy";
import { Socket } from "socket.io-client";

export class FileDecorationProvider implements vscode.FileDecorationProvider {
  private _genTooltip = "Generated";

  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;
  globalState: vscode.Memento
  emitter = new vscode.EventEmitter<vscode.Uri>();
  socket: any;

  public constructor(globalState: vscode.Memento, socket: Socket) {
    this.onDidChangeFileDecorations = this.emitter.event;
    this.globalState = globalState;
    this.socket = socket;
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;
    let tooltip = this._genTooltip;

    const allUsers = this.globalState.get(ALL_USERS)
    const currentUserSocketId = this.socket?.id;
    // const prevUri = currentUserSocketId in allUsers ? allUsers[currentUserSocketId]?.uri : null;

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() == uri.toString());
    if (
        doc != undefined &&
        !doc.isUntitled && 
        currentUserSocketId
    ){
        result = new vscode.FileDecoration("????", tooltip);
        this.socket.emit(USER_CLICK_ON_FILE, uri)
    }

    // // Remove decorator for the previous file that they click on
    // let removeUri = null;
    // if (prevUri){
    //   removeUri = vscode.workspace.textDocuments.find((d) => d.uri.toString() == prevUri.toString());
    // }
    // if (removeUri){
    //     result = undefined;
    // }
    return result;
  }
}