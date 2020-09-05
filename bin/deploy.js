const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;
const tempdir = require("../lib/tempdir");
const path = require("path");
const fs = require("fs");
const utils = require("../lib/utils.js");

exports = module.exports = async (program) => {
  /**
   * Deploy bot archives for conversations
   */
  program
    .command("deploy")
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null."
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .option("-b, --botarchive <value>", "Conversation Bundle, *required.")
    .action(async (cmd) => {
      require("./env.js"); // load environment variables
      let { provider, clientid, botarchive, clientsecret } = cmd;

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
          ">> connect to https://bot.chatopera.com, clientId %s, secret *** ...",
          clientid
        );
      }

      let tempc66 = null;
      let isRemoveC66 = false;
      if (fs.existsSync(botarchive)) {
        let isDirectory = fs.lstatSync(botarchive).isDirectory();
        if (!isDirectory && botarchive.endsWith(".c66")) {
          // 直接推送
          tempc66 = botarchive;
        } else if (isDirectory) {
          if (!path.isAbsolute(botarchive)) {
            botarchive = path.join(process.cwd(), botarchive);
          }

          let pkg = require(botarchive + "/index.json");
          debug("name: %s", pkg.name);

          // compress botarchive to zip
          let ts = utils.getTimestamp();
          tempc66 = path.join(tempdir, pkg.name + "." + ts + ".c66");

          await utils.zipDirectory(botarchive, tempc66);
          debug("deploy: generate temp file %s", tempc66);
          isRemoveC66 = true;
        } else {
          throw new Error("botarchive invalid file/directory format.");
        }
      } else {
        throw new Error("botarchive path not exist.");
      }

      let client = null;
      if (provider) {
        client = new Bot(clientid, clientsecret, provider);
      } else {
        client = new Bot(clientid, clientsecret);
      }
      // submit file
      let result = await client.deployConversation(tempc66);
      console.log("deploy: response %o", result);

      if (isRemoveC66) {
        // remove temp file
        fs.unlink(tempc66, (err) => {
          if (err) {
            console.error(err);
            return;
          }
          debug("%s removed.", tempc66);
        });
      }
    });
};
