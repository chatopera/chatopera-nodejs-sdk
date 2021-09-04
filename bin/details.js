const Bot = require("../index.js").Chatbot;
const logger = require("../lib/logger");

exports = module.exports = async (program) => {
  /**
   * Deploy bot archives for conversations
   */
  program
    .command("details")
    .description("get a bot's detail info, such as name, primaryLanguage")
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null."
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .action(async (cmd) => {
      require("./env.js"); // load environment variables
      let { provider, clientid, filepath, clientsecret, action } = cmd;

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

      let client = null;
      if (provider) {
        client = new Bot(clientid, clientsecret, provider);
      } else {
        client = new Bot(clientid, clientsecret);
      }

      let data = await client.command("GET", "/");

      logger.log(JSON.stringify(data, null, 2));
    });
};
