const debug = require("debug")("chatopera:sdk:cli");
const path = require("path");
const fs = require("fs");
const { Option } = require("commander");
const logger = require("../lib/logger.js");
const moment = require("moment-timezone");
const { exportConversations, importConversations } = require("../handlers/conversation.handler.js");

exports = module.exports = async (program) => {
  /**
   * Deploy bot archives for conversations
   */
  program
    .command("conversation")
    .description("import or export a bot's conversations data")
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null."
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .addOption(
      new Option("-a, --action <value>", "Operation action").choices([
        "import",
        "export",
      ])
    )
    .option(
      "-f, --filepath [value]",
      "Conversation Bundle(.c66 file) path for importing or exporting"
    )
    .action(async (cmd) => {
      require("../lib/loadenv.js"); // load environment variables
      let { provider, clientid, filepath, clientsecret, action } = cmd;

      if (typeof clientid === "boolean" || !clientid) {
        clientid = process.env["BOT_CLIENT_ID"];
        if (!clientid) {
          throw new Error(
            "[Error] Invalid clientid, set it with cli param `-c BOT_CLIENT_ID` or .env file"
          );
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

      /**
       * Resolve filepath
       */
      if (action == undefined) {
        logger.error(
          "error: option '-a, --action <value>' argument is invalid. Allowed choices are import, export."
        );
        process.exit(1);
      } else if (action == "import") {
        if (!filepath) {
          logger.error(
            `-f or --filepath FILE_PATH is required in command line for importing conversations.`
          );
          process.exit(1);
        }
        if (!fs.existsSync(filepath)) {
          logger.error(`${filepath} not found.`);
          process.exit(1);
        }
      } else {
        // for export
        if (typeof filepath === "boolean" || !filepath) {
          // generate a file
          filepath = path.join(
            process.cwd(),
            `bot.conversations.${moment()
              .tz(process.env.TZ)
              .format("YYYY_MM_DD_HHmmss")}.c66`
          );
        }

        if (fs.existsSync(filepath)) {
          logger.error(`${filepath} file exist`);
          process.exit(1);
        }
      }

      let payload = {
        clientid,
        clientsecret,
        provider,
        action,
        filepath,
      };

      if (action == "import") {
        await importConversations(payload);
      } else {
        await exportConversations(payload);
      }
    });
};
