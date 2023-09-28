"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHtmlCode = void 0;
const getHtmlCode = (nonce, webview, styles) => {
  const { stylesMainUri, cssUri, stylesResetUri, welcomeCssUri, image } =
    styles;
  return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <!--
              Use a content security policy to only allow loading images from https or from our extension directory,
              and only allow scripts that have a specific nonce.
      -->
      <meta http-equiv="Content-Security-Policy" img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${stylesResetUri}" rel="stylesheet">
          <link href="${stylesMainUri}" rel="stylesheet">
          <link href="${welcomeCssUri}" rel="stylesheet">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
      <link href="${cssUri}" rel="stylesheet">
      <script nonce="${nonce}">
      </script>
      </head>
      <body>
         

      <div class="body">
      <h1> <i class="fa fa-laptop icon"></i>Welcome to Hatchways Live Coding Interview Tool</h1>
        
      <h3 class="subtitle"> Hatchways Live Coding Interview tool allows you to seamlessly interview candidates through all type of assessments: backend, frontend, and full-stack.</h3>

    
      <img src="${image}" width="600"/>
      

      </div>


      </body>
      </html>`;
};
exports.getHtmlCode = getHtmlCode;
//# sourceMappingURL=WelcomePanelHTML.js.map
