import { Map } from "./types/extensionTypes";
import { Socket } from "socket.io-client";
import * as vscode from "vscode";

export class FileDecorationProvider
  implements vscode.Disposable, vscode.FileDecorationProvider
{
  socket: Socket;
  userOnFile: string | undefined;
  previousUri: vscode.Uri;
  name: string | undefined;

  disposable: vscode.Disposable; 
  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;
  emitter = new vscode.EventEmitter<vscode.Uri>();

  public constructor(socket: Socket, userId: string, currentUri: vscode.Uri, previousUri: vscode.Uri, name: string) {
    this.socket = socket;
    this.userOnFile = userId;
    this.name = name;

    this.onDidChangeFileDecorations = this.emitter.event;
    this.disposable = vscode.window.registerFileDecorationProvider(this);
    this.previousUri = previousUri;

    console.log(`constructor is called for ${currentUri.fsPath}`)
    this.emitter.fire(currentUri)
   
    if (previousUri && previousUri?.fsPath){
      this.emitter.fire(previousUri)
    } else {
      console.log('previousUri is null', previousUri);
    }
  
    /**
     * this.emitter.fire only allow us to set a single letter, such as "A" onto a file decoration.
     * Each user's name, such as "John", will be represented as "J".
     * If multiple users are on a file, we need to call `this.emitter.fire` multiple times.
     */
    // this.socketFileEventValue = value;
    // const files = this.socketFileEventValue?.files;
    // for (const filePath in files) {
    //   const uri = files[filePath]["uri"];
    //   this.emitter.fire(uri);
    // }
  }

  // provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
  //   let result: vscode.FileDecoration | undefined = undefined;
  //   const files = this.socketFileEventValue?.files;
  //   const allOnlineUsers = this.socketFileEventValue?.allOnlineUsers;
  //   const users = files[uri.fsPath]["users"];

  //   // User is not on the file
  //   if (this.userOnFile && !users.includes(this.userOnFile)) {
  //     return result;
  //   }

  //   // Assign decorator to the current file the user are clicking on
  //   const doc = vscode.workspace.textDocuments.find(
  //     (d) => d.uri.toString() == uri.toString()
  //   );
  //   const activeEditor = vscode.window.activeTextEditor;
  //   const pathBeingViewed = activeEditor
  //     ? activeEditor.document.uri.path
  //     : null;

  //   let badge = this.userOnFile ? allOnlineUsers?.[this.userOnFile]?.name : "";

  //   if (doc != undefined && !doc.isUntitled) {
  //     if (this.userOnFile === this.socket.id) {
  //       if (pathBeingViewed === doc.fileName) {
  //         result = new vscode.FileDecoration(
  //           badge?.[0],
  //           `${badge} is on this file`
  //         );
  //       }
  //     } else {
  //       result = new vscode.FileDecoration(
  //         badge?.[0],
  //         `${badge} is on this file`
  //       );
  //     }
  //   }
  //   return result;
  // }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;
  
    // User is not on the file
    if (this.previousUri && uri.fsPath === this.previousUri.fsPath) {
      console.log("user not in file", this.previousUri.fsPath);
      return result;
    }

    console.log(`attempting to find doc for ${uri.fsPath}`)

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );
    // const activeEditor = vscode.window.activeTextEditor;
    // const pathBeingViewed = activeEditor
    //   ? activeEditor.document.uri.path
    //   : null;
    
    if (doc != undefined && !doc.isUntitled) {
      console.log(`setting file for ${uri.fsPath} with name ${this.name}`)
      result = new vscode.FileDecoration(
          this.name?.[0],
          `${this.name} is on this file`
        );
     return result;
    } else {
      console.log(`no doc found for ${uri.fsPath}`)
    }
  }

  dispose() {
    // Dispose a FileDecoration when new changes appear.
    this.disposable.dispose();
  }
}
