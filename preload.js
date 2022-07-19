const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProcList: (name) => ipcRenderer.invoke('dialogue:getProcList',name),
  killProcByPID: (pid) => ipcRenderer.invoke('dialogue:killProcByPID',pid)
});

