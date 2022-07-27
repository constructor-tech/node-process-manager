const util = require('util');
const { exec } = require('child_process');

const execProm = util.promisify(exec);

const os = require('os');

const plat = os.platform();

/**
 * @typedef {Object} ProcessOutputFormat
 * @property {Array.<string[]>} processes - List of processes
 * @property {string} error - Any error(s) encountered
 */
/**
 * @typedef {Object} KillOutputFormat
 * @property {string} result - Result of the operation
 * @property {string} error - Any error(s) encountered
 */

/**
 * Thrown as an exception for unsupported systems
 * @constructor
 * @returns {String} stderr:'Operating system not supported'
 */
function OperatingSystemNotSupportedException() {
  this.stderr = 'Operating system not supported';
}

/**
 * Gets a list of processes from the operating system
 * @example
 * // returns {
 * //     processes: [
 * //       ['PID','Image Name'],
 * //       ['0','System Idle Process'],
 * //       ... more items
 * //     ],
 * //     error: ''
 * //   }
 * getProcList();
 * @example
 * // returns {
 * //     processes: null,
 * //     error: 'Operating system not supported'
 * //   }
 * getProcList();
 * @returns {ProcessOutputFormat} Returns the list of processes or any errors encountered.
 */
exports.getProcList = async () => {
  let result;
  try {
    switch (plat) {
      case 'win32':
        result = await execProm('C:/Windows/System32/tasklist.exe /FO CSV');
        return {
          processes: result.stdout.trim().split('\r\n').map((x) => x.slice(1).trim().split('","').slice(0, 2)
            .reverse()),
          error: result.stderr,
        };
      case 'linux':
        result = await execProm("ps -e -ww -o pid,command | awk '{printf \"%s,/\",$1;$1=\"\";print substr($0,2)}'"); // Fixed vulnerability by making delimiter impossible to name
        return { processes: result.stdout.trim().split('\n').map((x) => x.trim().split(/\/(.*)/s).slice(0, 2)), error: result.stderr };
      case 'darwin':
        result = await execProm("ps -ec -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'"); // TODO: same fix as for linux
        return { processes: result.stdout.trim().split('\n').map((x) => x.trim().split(',')), error: result.stderr };
      default:
        throw new OperatingSystemNotSupportedException();
    }
  } catch (ex) {
    if (ex.stderr !== undefined) {
      return { processes: null, error: ex.stderr }; // Not an empty list to keep it consistent
    }
    return { processes: null, error: ex };
  }
};

/*
 * Kills a process by its PID
 * @example
 * // returns {
 * //     result: 'SUCCESS: The process ... has been terminated.',
 * //     error: ''
 * //   }
 * killProcByPID(2696);
 * @example
 * // returns {
 * //     result: null,
 * //     error: 'ERROR: The process ... could not be terminated ...'
 * //   }
 * killProcByPID(0);
 * @example
 * // returns {
 * //     result: null,
 * //     error: 'ERROR: The process ... not found.'
 * //   }
 * killProcByPID(-5);
 * @example
 * // returns {
 * //     result: null,
 * //     error: 'Operating system not supported'
 * //   }
 * killProcByPID(2696);
 * @example
 * // returns {
 * //     result: null,
 * //     error: 'PID is not a number'
 * //   }
 * killProcByPID('five');
 * @example
 * // On Unix:
 * // returns {result:'',error:''}
 * killProcByPID('5321');
 * @returns {KillOutputFormat} Returns whether the operation was successful
 */
exports.killProcByPID = async (pid) => {
  if (Number.isNaN(parseInt(pid, 10))) { // Check for security reasons
    return { result: null, error: 'PID is not a number' };
  }
  let result;
  try {
    switch (plat) {
      case 'win32':
        result = await execProm(`C:/Windows/System32/taskkill /F /PID ${pid}`);
        break;
      case 'linux':
      case 'darwin':
        result = await execProm(`kill -9 ${pid}`);
        break;
      default:
        throw new OperatingSystemNotSupportedException();
    }
  } catch (ex) {
    return { result: null, error: ex.stderr };
  }
  return { result: result.stdout, error: result.stderr };
};

//exports.getProcList().then((result) => {
//  console.log(result.processes.slice(-100));
//});
/*
process.stdin.setEncoding('utf8');
let name;
process.stdin.on('readable', () => {
  name = process.stdin.read();
  if (name !== null) {
    exports.killProcByPID(name).then((result) => {
      console.log(result);
    });
  }
});
*/
