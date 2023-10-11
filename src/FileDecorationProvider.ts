import { Socket } from "socket.io-client";
import * as vscode from "vscode";

export class FileDecorationProvider
  implements vscode.Disposable, vscode.FileDecorationProvider
{
  socket: Socket;
  userOnFile: string | undefined;
  previousUri: vscode.Uri | undefined;
  name: string | undefined;

  disposable: vscode.Disposable;
  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;
  emitter = new vscode.EventEmitter<vscode.Uri>();

  public constructor(socket: Socket, userId: string, name: string) {
    this.socket = socket;
    this.userOnFile = userId;
    this.name = name;

    this.onDidChangeFileDecorations = this.emitter.event;
    this.disposable = vscode.window.registerFileDecorationProvider(this);
  }

  public updateFiles(currentUri: vscode.Uri) {
    this.emitter.fire(currentUri);
  }

  public removeFiles(previousUri: vscode.Uri) {
    if (previousUri) {
      this.previousUri = previousUri;
      this.emitter.fire(previousUri);
    }
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    console.log("provide file decoration is called", uri.fsPath);
    let result: vscode.FileDecoration | undefined = undefined;

    // User is not on the file
    if (this.previousUri && uri.fsPath === this.previousUri.fsPath) {
      console.log("previous uri", uri.fsPath);
      return result;
    }

    console.log("finding doc");

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );

    const activeEditor = vscode.window.activeTextEditor;

    if (this.socket.id === this.userOnFile) {
      const pathBeingViewed = activeEditor
        ? activeEditor.document.uri.path
        : null;
      if (pathBeingViewed !== doc?.fileName) {
        return result;
      }
    }

    result = new vscode.FileDecoration(
      this.name?.[0],
      `${this.name} is on this file`
    );
    return result;

    // if (doc != undefined && !doc.isUntitled) {
    //   if (this.userOnFile === this.socket.id) {
    // const pathBeingViewed = activeEditor
    //   ? activeEditor.document.uri.path
    //   : null;
    //     if (pathBeingViewed !== doc.fileName) {
    //       return result;
    //     }
    //   } else {
    //     console.log('this portion is called???');
    //     if (uri?.path && uri?.path !== activeEditor?.document?.uri.path) {
    //       console.log('beside is called', uri.path);
    //       vscode.window.showTextDocument(vscode.Uri.file(uri.path), { viewColumn: vscode.ViewColumn.Beside });
    //     }
    //   }

    //   console.log('badge is set')
    // result = new vscode.FileDecoration(
    //   this.name?.[0],
    //   `${this.name} is on this file`
    // );
    // return result;
    // }
  }

  dispose() {
    // Dispose a FileDecoration when new changes appear.
    this.disposable.dispose();
  }
}
