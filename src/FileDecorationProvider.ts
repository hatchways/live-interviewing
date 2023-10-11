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

  public constructor(
    socket: Socket,
    userId: string,
    currentUri: vscode.Uri,
    name: string
  ) {
    this.socket = socket;
    this.userOnFile = userId;
    this.name = name;

    this.onDidChangeFileDecorations = this.emitter.event;
    this.disposable = vscode.window.registerFileDecorationProvider(this);

    this.emitter.fire(currentUri);
  }

  public updateFiles(currentUri: any) {
    this.emitter.fire(currentUri);
  }

  public removeFiles(previousUri: any) {
    if (previousUri) {
      this.previousUri = previousUri;
      this.emitter.fire(previousUri);
    }
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;

    // User is not on the file
    if (this.previousUri && uri.fsPath === this.previousUri.fsPath) {
      return result;
    }

    // Assign decorator to the current file the user are clicking on
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() == uri.toString()
    );

    const activeEditor = vscode.window.activeTextEditor;
    const pathBeingViewed = activeEditor
      ? activeEditor.document.uri.path
      : null;

    if (doc != undefined && !doc.isUntitled) {
      if (this.userOnFile === this.socket.id) {
        if (pathBeingViewed !== doc.fileName) {
          return result;
        }
      }
      result = new vscode.FileDecoration(
        this.name?.[0],
        `${this.name} is on this file`
      );
      return result;
    }
  }

  dispose() {
    // Dispose a FileDecoration when new changes appear.
    this.disposable.dispose();
  }
}
