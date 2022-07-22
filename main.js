const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const util = require('util');
const { exec } = require('child_process');

const execProm = util.promisify(exec);

const os = require('os');

const plat = os.platform();

// eslint-disable-next-line no-unused-vars
async function getProcList(event) {
  let result = { stdout: '', stderr: '' };
  try {
    if (plat === 'win32') {
      result = await execProm('C:/Windows/System32/tasklist.exe /FO CSV');
      result.stdout = result.stdout.trim().split('\r\n');
      for (let i = 0; i < result.stdout.length; i += 1) {
        result.stdout[i] = result.stdout[i].split(',').slice(0, 2).reverse().join(',')
          .trim()
          .replace(/"/g, '');
      }
    } else if (plat === 'linux') {
      result = await execProm("ps -e -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'");
      result.stdout = result.stdout.trim().split('\n');
    } else if (plat === 'darwin') {
      result = await execProm("ps -ec -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'");
      result.stdout = result.stdout.trim().split('\n');
    }
  } catch (ex) {
    result.stdout = 'ERROR';
    result.stderr = ex;
  }

  return result;
}

async function killProcByPID(event, pid) {
  let result = { stdout: '', stderr: '' };
  try {
    if (plat === 'win32') {
      result = await execProm(`C:/Windows/System32/taskkill /F /PID ${pid}`);
    } else if (plat === 'linux' || plat === 'darwin') {
      result = await execProm(`kill -9 ${pid}`);
    }
  } catch (ex) {
    result.stdout = 'ERROR';
    result.stderr = ex;
  }
  return result;
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
};

app.whenReady().then(() => {
  ipcMain.handle('getProcList', getProcList);
  ipcMain.handle('killProcByPID', killProcByPID);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
