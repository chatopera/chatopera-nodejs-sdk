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
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null"
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.cskefu.com"
    )
    .option(
      "-l, --log-level [value]",
      "Log level to follow, optional, [DEBUG|INFO|WARN|ERROR], default DEBUG"
    )
    .action(async (cmd) => {
      require("./env.js"); // load environment variables
      debug("connect cmd %o", cmd);

      let { provider, clientid, clientsecret, logLevel } = cmd;

      if (typeof clientid === "boolean" || !clientid) {
        clientid = process.env["BOT_CLIENT_ID"];
        if (!clientid) {
          throw new Error(
            "[Error] Invalid clientid, set it with cli param `-c CLIENT_ID` or .env file"
          );
        }
      }

      if (typeof clientsecret === "boolean" || !clientsecret) {
        clientsecret = process.env["BOT_CLIENT_SECRET"];
        if (!clientsecret) {
          console.log("[WARN] client secret is not configured.");
        }
      }

      if (typeof provider === "boolean" || !provider) {
        provider = process.env["BOT_PROVIDER"];
      }

      if (!!provider) {
        console.log(
          ">> connect to %s, clientId %s, secret *** ...",
          provider,
          clientid
        );
      } else {
        console.log(
          ">> connect to https://bot.cskefu.com, clientId %s, secret *** ...",
          clientid
        );
      }

      if (typeof logLevel === "boolean") {
        logLevel = "DEBUG";
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
