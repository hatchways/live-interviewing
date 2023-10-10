# hatchways-live-interviewing VS Code extension

## To run

```
npm install

npm run watch

node server/index.js
```
Then open the project in Visual Studio Code.
Go to `extension.ts` then press F5.

## To install as an extension

```
npm install -g @vscode/vsce

cd live-interviewing

vsce package
```

You should see a file titled `hatchways-live-interviewing-0.0.1.vsix` being generated.

Go to Visual Studio Code, click on Extensions. Click on the three dots "..." on the topmost right corner > Install from VSIX > Select hatchways-live-interviewing-0.0.1.vsix
