const { app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')

const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);
const axios = require('axios')

const os = require("os");
const plat = os.platform();

async function getProcList(a,username) {
    let result = {stdout:"",stderr:""};
    try{
        if (plat == "win32"){
            result = await execProm("C:/Windows/System32/tasklist.exe /FO CSV")
            result.stdout = result.stdout.trim().split("\r\n")
            for (var i=0; i<result.stdout.length; i++){
                result.stdout[i] = result.stdout[i].split(",").slice(0,2).reverse().join(",").trim().replace(/"/g,"")
            }
        } else if (plat == "linux"){
            result = await execProm("ps -e -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'")
            result.stdout = result.stdout.trim().split("\n")
        } else if (plat == "darwin"){
            result = await execProm("ps -ec -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'")
            result.stdout = result.stdout.trim().split("\n")
        }
    } catch(ex){
        result.stdout="ERROR";
        result.stderr=ex;
    }
    
    return result;
    /* Sends processes to server
    return axios
        .post('https://prod-06.southeastasia.logic.azure.com:443/workflows/898a26cfed1f49909df70913dc02df71/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=gGZ-VuItJgZ8aGQZxZ73J_HN2IH7HvcphcCg7mIFGRA',{
            name: username,
            stdout: result.stdout,
            stderr: result.stderr
        })
        .then(res => {
            console.log(`statusCode: ${res.status}`);
            return "Sent processeses successfully";
        })
        .catch(error => {
            return "Failed to send processes" + error;
        })*/
};

async function killProcByPID(a,pid) {
    let result = {stdout:"",stderr:""};
    try{
        if (plat == "win32"){
            result = await execProm("C:/Windows/System32/taskkill /F /PID "+pid);
        } else if (plat == "linux" || plat == "darwin"){
            result = await execProm("kill -9 "+pid);
        }
    } catch(ex){
        result.stdout="ERROR";
        result.stderr=ex;
    }
    return result;
}


// modify your existing createWindow() function
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  ipcMain.handle('dialogue:getProcList',getProcList)
  ipcMain.handle('dialogue:killProcByPID',killProcByPID)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
