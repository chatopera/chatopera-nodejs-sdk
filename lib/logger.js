"use strict";

/**
 * Enhance console log with Timestamp
 */
const moment = require("moment-timezone");
const util = require("util");
const Console = require("console").Console;
const timezone = "Asia/Shanghai";
const format = "YYYY-MM-DD HH:mm:ss";

class Logger extends Console {
  constructor(stdout, stderr, ...otherArgs) {
    super(stdout, stderr, ...otherArgs);
  }

  log(...args) {
    super.log(
      moment().tz(timezone).format(format),
      "INFO",
      util.format(...args)
    );
  }

  warn(...args) {
    super.error(
      moment().tz(timezone).format(format),
      "WARN",
      util.format(...args)
    );
  }

  error(...args) {
    super.error(
      moment().tz(timezone).format(format),
      "ERROR",
      util.format(...args)
    );
  }
}

module.exports = (function () {
  return new Logger(process.stdout, process.stderr);
})();
