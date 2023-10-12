import { stateManager } from "./context";
import { USER_READY } from "./utils/constants";
import { getNonce } from "./utils/getNonce";
import { exec } from "child_process";
import { Socket } from "socket.io-client";
import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _sessionId: string,
    private _socket: Socket,
    private _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      const { setUser } = stateManager(this._context);

      switch (data.type) {
        case "inputName": {
          if (!data.value) {
            return;
          }

          await setUser(this._socket.id, { name: data.value });

          this._socket.emit(USER_READY, {
            sessionId: this._sessionId,
            name: data.value,
          });
          if (vscode.workspace.workspaceFolders) {
            vscode.commands.executeCommand(
              "workbench.files.action.showActiveFileInExplorer"
            );

            // Run code to automatically install files in a folder
            const workspace = vscode.workspace.workspaceFolders?.[0];
            const currentWorkspacePath = workspace.uri.fsPath;
            if (!process.env.RUN_COMMAND){
              return;
            }
            exec(
              process.env.RUN_COMMAND,
              { cwd: currentWorkspacePath },
              (error, stdout, stderr) => {
                if (error) {
                  vscode.window.showErrorMessage(
                    `Error running ${process.env.RUN_COMMAND}: ${error.message}`
                  );
                  return;
                }
                vscode.window.showInformationMessage(
                  `Run ${process.env.RUN_COMMAND} with output ${stdout}`
                );
              }
            );
          }
          break;
        }

        case "endInterview": {
          vscode.window.showInformationMessage(
            "Successfully ended your interview. You can leave this session."
          );
          // TODO:
          // this is the part where we have to commit their code to GitHub.
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
          const globalName = "Minh"
          </script>
       </head>
       <body>
       <script src="${scriptUri}" nonce="${nonce}">
       
       </script>
       </body>
    </html>`;
  }
}
