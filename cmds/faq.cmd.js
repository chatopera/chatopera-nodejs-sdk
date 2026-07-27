const debug = require("debug")("chatopera:sdk:cli:faq");
const { Option } = require("commander");
const Bot = require("../index.js").Chatbot;
const fs = require("fs");
const moment = require("moment-timezone");
const logger = require("../lib/logger.js");
const _ = require("lodash");
const { sleep } = require("../lib/utils.js");
const faqHandler = require("../handlers/faq.handler.js");

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("faq")
    .description("import, export or drop all bot's faqs data")
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null"
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .addOption(
      new Option("-a, --action <value>", "Operation action").choices([
        "train", // 重新训练知识库：完成同步自定义词典, etc.
        "import", // 导入知识库
        "export", // 导出知识库
        "dropall", // 清空知识库问答对
      ])
    )
    .option(
      "-f, --filepath [value]",
      "Export json data to file path or import json data with file path"
    )
    .action(async (cmd) => {
      require("../lib/loadenv.js"); // load environment variables
      debug("connect cmd %o", cmd);

      let { provider, clientid, clientsecret, action, filepath } = cmd;

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

      if (action == undefined) {
        logger.error(
          "error: option '-a, --action <value>' argument is invalid. Allowed choices are import, export, train, dropall."
        );
        process.exit(1);
      } else if (action == "import") {
        if (!filepath) {
          logger.error(
            `-f or --filepath FILE_PATH is required in command line for importing faq.`
          );
          process.exit(1);
        }

        if (!fs.existsSync(filepath)) {
          logger.error(`${filepath} not found.`);
          process.exit(1);
        } else if (!filepath.endsWith(".json")) {
          logger.error(
            `${filepath} is not end with .json, it has to be in JSON format and ends with .json`
          );
          process.exit(1);
        }
      } else if (action == "export") {
        // for export
        if (typeof filepath === "boolean" || !filepath) {
          // generate a file
          filepath = require("path").join(
            process.cwd(),
            `bot.faqs.${moment()
              .tz(process.env.TZ)
              .format("YYYY_MM_DD_HHmmss")}.json`
          );
        }

        if (fs.existsSync(filepath)) {
          logger.error(`${filepath} file exist`);
          process.exit(1);
        }
      } else if (action == "dropall") {
        console.log("[CAUTION] this will drop all the faq data and unrecoverable, the job would start in 5 seconds, cancel this operation in 5s by Ctrl + C.");
        console.log("【注意】该操作将会删除 BOT 知识库问答对数据，此操作不可以，任务会在 5 秒后开始，5秒内可按 Ctrl + C 取消.");
        await sleep(5);
        console.log("Start to drop all FAQ data ...");
      } else if (action == "train") {
        // continue
      } else {
        logger.error(`Unexpected action ${action}`)
        process.exit(2);
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

      let payload = {
        provider,
        clientid,
        clientsecret,
        action,
        filepath,
        format: "json", // currently, for import and export, only in json format.
      };

      if (action == "import") {
        await faqHandler.faqImport(payload);
      } else if (action == "export") {
        await faqHandler.faqExport(payload);
      } else if (action == "dropall") {
        await faqHandler.faqDropAll(payload);
      } else if (action == "train") {
        await faqHandler.faqTrain(payload);
      }
    });
};
