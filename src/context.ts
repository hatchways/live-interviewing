import { makeDeepCopy } from "./utils/makeDeepCopy";
import { Map } from "./types/extensionTypes"
import * as vscode from "vscode";

export function stateManager (context: any) {
    return {
      get,
      set,
      setUser,
      removeUser
    }
  
    function get() {
      return context.workspaceState.get('onlineUsers') || {};
    }
  
    async function set (value: any) {
      await context.workspaceState.update('onlineUsers', value);
    }

    async function setUser(userId: string, properties: Map){
        const onlineUsers = get();
        const copy = makeDeepCopy(onlineUsers);

        if (!onlineUsers || !(userId in onlineUsers)){
            copy[userId] = {
                name: "Anonymous",
                color: "",
                cursorPosition: null,
                filePosition: null,   
            }
        }

        for (const k in properties){
            if (k in copy[userId] && properties[k]){
                copy[userId][k] = properties[k];
            }
        }
        await set(copy);
    }

    async function removeUser(userId: string){
        const onlineUsers = get();
        const copy = makeDeepCopy(onlineUsers);

        if (userId in onlineUsers){
            delete copy[userId]
        }

        await set(copy);
    }
}
  

export function filesManager (context: any) {
    return {
      getFiles,
      setFile,
      removeUserFromFile
    }
  
    function getFiles() {
      return context.workspaceState.get('files') || {};
    
    }
  
    async function setFiles(value: any) {
      await context.workspaceState.update('files', value);

      console.log('files are set', getFiles());
    }

    async function setFile(userId: string, fileUri: vscode.Uri){
        const files = getFiles();
        const copy = makeDeepCopy(files);
        const filePath = fileUri.fsPath;
        if (!filePath){
            return;
        }

        if (!(filePath in copy)){
            copy[filePath] = []
        }

        if (!(copy[filePath].includes(userId))){
            copy[filePath].push(userId);
        }

        await setFiles(copy);
    }


    async function removeUserFromFile(userId: string, fileUri: vscode.Uri){
        const files = getFiles();
        const copy = makeDeepCopy(files);

        if (!fileUri || !(fileUri?.fsPath)){
            return;
        }

        const filePath = fileUri?.fsPath;
        if (filePath in files && files[filePath]?.includes(userId)){
            const index = files[filePath].findIndex((x: string) => x === userId);
            if (index !== -1){
                copy[filePath].splice(index, 1);
            }
        }
        await setFiles(copy);
    }
}


  