const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;

const moment = require("moment-timezone");
const TRACE_IDS = new Set();

function traceLoop(client, logLevel, afterDate) {
  return new Promise((resolve, reject) => {
    client
      .command("POST", "/conversation/trace", {
        logLevel: logLevel,
        afterDate: afterDate,
      })
      .then((res) => {
        if (res.rc === 0 && res.data && res.data.length > 0) {
          let len = res.data.length - 1;
          let afterDate = null;
          for (let i = 0; i < len; i++) {
            // 去重
            if (TRACE_IDS.has(res.data[i]["id"])) continue;
            TRACE_IDS.add(res.data[i]["id"]);

            var date = moment.tz(res.data[i]["createdAt"], process.env.TZ);
            console.log(
              "%s %s %s %s",
              date.format("YYYY-MM-DD HH:mm:ss"),
              res.data[i]["logLevel"],
              res.data[i]["service"],
              res.data[i]["message"]
            );
            if (i == len) {
              afterDate = res.data[i]["createdAt"];
            }
          }
          resolve({
            afterDate,
          });
        } else {
          // 没有得到数据
          resolve({
            afterDate,
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

exports = module.exports = async (program) => {
  /**
   * Trace logs for bot.
   */
  program
    .command("trace")
    .option("-c, --clientid <value>", "ClientId of the bot, *required.")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null"
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .option(
      "-l, --log-level [value]",
      "Log level to follow, optional, [DEBUG|INFO|WARN|ERROR], default DEBUG"
    )
    .action(async (cmd) => {
      debug("connect cmd %o", cmd);

      let { provider, clientid, clientsecret, logLevel } = cmd;

      if (typeof clientsecret === "boolean") {
        clientsecret = null;
      }

      if (typeof provider === "boolean") {
        provider = null;
      }

      if (typeof logLevel === "boolean") {
        logLevel = "DEBUG";
      }

      if (!!provider) {
        console.log(">> connect to " + provider + " ...");
      } else {
        console.log(">> connect to https://bot.chatopera.com ...");
      }

      console.log("[trace] clientId %s, logLevel %s", clientid, logLevel);

      let client = null;
      if (provider) {
        client = new Bot(clientid, clientsecret, provider);
      } else {
        client = new Bot(clientid, clientsecret);
      }

      const sleep = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        });
      };

      let afterDate = null;

      while (true) {
        let ret = await traceLoop(client, logLevel, afterDate);
        if (ret.afterDate) afterDate = ret.afterDate;
        // 每3s请求一次日志
        await sleep();
      }
    });
};