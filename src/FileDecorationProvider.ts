import * as vscode from "vscode";

export class FileDecorationProvider implements vscode.FileDecorationProvider {
  genBadge: string;
  private _genTooltip = "Generated";
  onDidChangeFileDecorations: vscode.Event<vscode.Uri>;

  emitter = new vscode.EventEmitter<vscode.Uri>();

  public constructor(badge: string) {
    this.onDidChangeFileDecorations = this.emitter.event;
    this.genBadge = badge;
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    let result: vscode.FileDecoration | undefined = undefined;
    let tooltip = this._genTooltip;


    const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() == uri.toString());
    if (
        doc != undefined &&
        !doc.isUntitled
    ){
        result = new vscode.FileDecoration(this.genBadge, tooltip);
    }

    // const toBeDeleted = '/Users/minhle/go/pkg/mod/google.golang.org/genproto@v0.0.0-20191115221424-83cc0476cb11/googleapis/ads/googleads/v2/enums/matching_function_operator.pb.go'
    // if (uri.path.toString() === toBeDeleted){
    //     result = undefined;
    // }
    return result;
  }
}