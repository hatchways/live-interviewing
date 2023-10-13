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

vsce package
```

You should see a .vsix file being generated.

Go to Visual Studio Code, click on Extensions. Click on the three dots "..." on the topmost right corner > Install from VSIX > Select the .vsix file.

When releasing a new version, be sure to also replace the existing latest release and tag with a new version. When attaching the .vsix file to the latest release, ensure the file is named live-session-vscode-extension.vsix without a version number.

## To Test

Since VSCode automatically open only one window for the same repository, to create two workspaces, do ⌘ + Shift + P (on MacOS) to open Command Palette then select "Workspaces: duplicate as workspace in new window"
