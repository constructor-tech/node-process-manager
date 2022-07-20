const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);

const os = require("os");
const plat = os.platform();

exports.getProcList = async function (username) {
    let result = {stdout:"",stderr:""};
    try{
        if (plat == "win32"){
            result = await execProm("C:/Windows/System32/tasklist.exe /FO CSV")
            result.stdout = result.stdout.trim().split("\r\n")
            for (var i=0; i<result.stdout.length; i++){
                result.stdout[i] = result.stdout[i].replace(/"/g,"").trim().split(",").slice(0,2).reverse()
            }
        } else {
            if (plat == "linux"){
                result = await execProm("ps -e -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'")
                result.stdout = result.stdout.trim().split("\n")
            } else if (plat == "darwin"){
                result = await execProm("ps -ec -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'")
                result.stdout = result.stdout.trim().split("\n")
            }
            for (var i=0; i<result.stdout.length; i++){
                result.stdout[i] = result.stdout[i].trim().split(",")
            }
        }
    } catch(ex){
        result.stdout="ERROR";
        result.stderr=ex;
    }
    
    
    return result;
};

exports.killProcByPID = async function (pid) {
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