import { getNonce } from "./utils/getNonce";
import * as vscode from "vscode";
import { CURRENT_USER, USER_JOIN } from "./utils/globalStateKey";
import { Socket } from "socket.io-client";


export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri, private _globalState: vscode.Memento, private _socket: Socket) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "inputName": {
          if (!data.value) {
            return;
          }
          this._globalState.update(CURRENT_USER, data.value);    
          this._socket.emit(USER_JOIN, data.value);      
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    // Custom JS and CSS
    const mainStyleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "out/compiled", "Sidebar.css")
      );
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "out/compiled", "Sidebar.js")
      );
    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();
    // const globalName = this._globalState.get(CURRENT_USER);


    return `<!DOCTYPE html>
    <html lang="en">
       <head>
          <meta charset="UTF-8">
          <!--
             Use a content security policy to only allow loading images from https or from our extension directory,
             and only allow scripts that have a specific nonce.
                -->
          <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
          <link href="${mainStyleUri}" rel="stylesheet">
          <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
          </script>
       </head>
       <body>
       <script src="${scriptUri}" nonce="${nonce}">
       
       </script>
       </body>
    </html>`;
  }
}
