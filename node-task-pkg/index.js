const util = require('util');
const { exec } = require('child_process');

const execProm = util.promisify(exec);

const os = require('os');

const plat = os.platform();

/**
 * Thrown as an exception for unsupported systems
 * @constructor
 * @returns {String} stderr
 */
function OperatingSystemNotSupportedException() {
  this.stderr = 'Operating system not supported';
}

/**
 * Return value for getProcList function
 * @constructor
 * @returns {String} processes
 * @returns {String} error
 */
function ProcessOutputFormat() {
  this.processes = '';
  this.error = '';
}

/**
 * Return value for killProcByPID function
 * @constructor
 * @returns {String} result
 * @returns {String} error
 */
function KillOutputFormat() {
  this.result = '';
  this.error = '';
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
 * //     processes: 'ERROR',
 * //     error: 'Operating system not supported'
 * //   }
 * getProcList();
 * @returns {ProcessOutputFormat} Returns the list of processes or any errors encountered.
 */
exports.getProcList = async () => {
  const output = new ProcessOutputFormat();
  let result = { stdout: '', stderr: '' };
  try {
    let i;
    switch (plat) {
      case 'win32':
        result = await execProm('C:/Windows/System32/tasklist.exe /FO CSV');
        output.processes = result.stdout.trim().split('\r\n').map(x => x.replace(/"/g, '').trim().split(',').slice(0, 2).reverse());
        break;
      case 'linux':
        result = await execProm("ps -e -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'");
        output.processes = result.stdout.trim().split('\n').map(x => x).trim().split(',');
        break;
      case 'darwin':
        result = await execProm("ps -ec -o pid,command | awk '{printf \"%s,\",$1;$1=\"\";print substr($0,2)}'");
        output.processes = result.stdout.trim().split('\n').map(x => x.trim().split(','));
        break;
      default:
        throw new OperatingSystemNotSupportedException();
    }
  } catch (ex) {
    output.processes = 'ERROR';
    output.error = ex.stderr;
  }

  return output;
};

/**
 * Kills a process by its PID
 * @example
 * // returns {
 * //     result: 'SUCCESS: The process ... has been terminated.',
 * //     error: ''
 * //   }
 * killProcByPID(2696);
 * @example
 * // returns {
 * //     processes: 'ERROR',
 * //     error: 'ERROR: The process ... could not be terminated ...'
 * //   }
 * killProcByPID(0);
 * @example
 * // returns {
 * //     processes: 'ERROR',
 * //     error: 'ERROR: The process ... not found.'
 * //   }
 * killProcByPID(-5);
 * @example
 * // returns {
 * //     processes: 'ERROR',
 * //     error: 'Operating system not supported'
 * //   }
 * killProcByPID(2696);
 * @returns {ProcessOutputFormat} Returns the list of processes or any errors encountered.
 */
exports.killProcByPID = async (pid) => {
  const output = new KillOutputFormat();
  let result = { stdout: '', stderr: '' };
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
    output.result = result.stdout;
  } catch (ex) {
    output.result = 'ERROR';
    output.error = ex.stderr;
  }
  return output;
};

exports.getProcList().then((result) => {
  console.log(result);
});

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
