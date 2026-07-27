const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;
const logger = require("../lib/logger.js");
const moment = require("moment-timezone");
const { sleep } = require("../lib/utils.js");
const traceHandler = require("../handlers/trace.handler.js");
const TRACE_IDS = new Set();

exports = module.exports = async (program) => {
  /**
   * Trace logs for bot.
   */
  program
    .command("trace")
    .description("tail a bot's conversations logging info")
    .option("-c, --clientid [value]", "ClientId of the bot")
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
      require("../lib/loadenv.js"); // load environment variables
      debug("connect cmd %o", cmd);

      let { provider, clientid, clientsecret, logLevel } = cmd;

      if (typeof clientid === "boolean" || !clientid) {
        clientid = process.env["BOT_CLIENT_ID"];
        if (!clientid) {
          logger.error(
            "[Error] Invalid clientid, set it with cli param `-c BOT_CLIENT_ID` or .env file"
          );
          process.exit(1);
        }
      }

      if (typeof clientsecret === "boolean" || !clientsecret) {
        clientsecret = process.env["BOT_CLIENT_SECRET"];
        if (!clientsecret) {
          logger.log("[WARN] client secret is not configured.");
        }
      }

      if (typeof provider === "boolean" || !provider) {
        provider = process.env["BOT_PROVIDER"];
      }

      if (!!provider) {
        logger.log(
          ">> connect to %s, clientId %s, secret *** ...",
          provider,
          clientid
        );
      } else {
        logger.log(
          ">> connect to https://bot.chatopera.com, clientId %s, secret *** ...",
          clientid
        );
      }

      if (typeof logLevel === "boolean") {
        logLevel = "DEBUG";
      }
      logger.log("[trace] clientId %s, logLevel %s", clientid, logLevel);

      let afterDate = null;
      let keepWatchLog = true;

      while (keepWatchLog) {
        try {
          let ret = await traceHandler.fetchTraceLog(clientid, clientsecret, provider, logLevel, afterDate);

          if (ret.data) {
            let len = ret.data.length - 1;
            for (let i = 0; i < len; i++) {
              // 去重
              if (TRACE_IDS.has(ret.data[i]["id"])) continue;
              TRACE_IDS.add(ret.data[i]["id"]);

              var date = moment.tz(ret.data[i]["createdAt"], process.env.TZ);
              logger.log(
                "%s %s %s %s",
                date.format("YYYY-MM-DD HH:mm:ss"),
                ret.data[i]["logLevel"],
                ret.data[i]["service"],
                ret.data[i]["message"]
              );
              if (i == len) {
                afterDate = ret.data[i]["createdAt"];
              }
            }
          } else if (ret.afterDate) {
            afterDate = ret.afterDate;
          }

          // 每3s请求一次日志
          await sleep(3);
        } catch (err) {
          console.error(err);
        }
      };
    });
}
