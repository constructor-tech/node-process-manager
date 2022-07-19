const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProcList: (name) => ipcRenderer.invoke('dialogue:getProcList',name),
  killProcByPID: (pid) => ipcRenderer.invoke('dialogue:killProcByPID',pid)
});


const os = require("os");
window.addEventListener('DOMContentLoaded', () => {
    const name = document.getElementById('name');
    name.value = os.hostname();
});

/*
const { exec } = require("child_process");
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
    console.log('a');
  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
  console.log('a');
  exec("tasklist /FO LIST", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    document.body.innerHTML += '<br>'+stdout.replace(/(?:\r\n|\r|\n)/g, '<br>');
    console.log(stdout);
});

})*/