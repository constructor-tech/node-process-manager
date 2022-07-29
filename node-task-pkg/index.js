const util = require('util');
const { exec } = require('child_process');

const execProm = util.promisify(exec);

const os = require('os');

const plat = os.platform();

const { readdir } = require('node:fs/promises');
const { readFile } = require('node:fs/promises');

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
 * Gets a list of processes from a linux system
 * @example
 * // returns {
 * //     processes: [
 * //       [ 1, '/sbin/init\x00splash' ],
 * //       ... more items
 * //     ],
 * //     error: ''
 * //   }
 * getLinuxProc();
 * @returns {ProcessOutputFormat} Returns the list of processes or any errors encountered.
 */
async function getLinuxProc() {
  const out = [];
  try {
    const files = await readdir('/proc/');
    const promises = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file[0] >= '0' && file[0] <= '9') {
        if (!Number.isNaN(parseInt(file, 10))) {
          const statPath = `/proc/${file}/cmdline`;
          promises.push(readFile(statPath, 'utf-8').then(async (data) => {
            try {
              const dataBytes = data.slice(0, -1);
              if (dataBytes !== '') {
                out.push([file, dataBytes]);
              }
            } catch (err) {
              // Error here means that the process does not exist anymore
            }
          }));
        }
      }
    }
    await Promise.all(promises);
  } catch (err) {
    return { processes: null, error: err };
  }
  return { processes: out, error: null };
}

/**
 * Gets a list of processes from the operating system
 * @example
 * // returns {
 * //     processes: [
 * //       ['PID','Image Name'], //TODO: This line needs to be removed in mac
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
          processes: result.stdout.trim().split('\r\n').slice(1).map((x) => x.slice(1).trim().split('","').slice(0, 2)
            .reverse()),
          error: result.stderr,
        };
      case 'linux':
        return await getLinuxProc();
      case 'darwin':
        result = await execProm("ps -ec -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'");
        return { processes: result.stdout.trim().split('\n').slice(1).map((x) => x.trim().split(',')), error: result.stderr };
      default:
        throw new OperatingSystemNotSupportedException();
    }
  } catch (ex) {
    if (ex.stderr !== undefined) {
      return { processes: null, error: ex.stderr };
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
  if (!Number.isInteger(parseInt(pid, 10))) {
    return { result: null, error: 'PID is not a number' };
  }
  pid = parseInt(pid,10);
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
