const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;
const logger = require("../lib/logger");

const N_BEST_DEFAULT = 5;
const DEFAULT_USER = "commandline";

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("asr")
    .description(
      "request Chatopera ASR API, https://docs.chatopera.com/products/chatbot-platform/howto-guides/asr/asr-request.html"
    )
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null"
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .option("-u, --username [value]", "Username to chat with bot")
    .option("-f, --filepath <value>", "Target file to recognize, *required.")
    .action(async (cmd) => {
      require("../lib/loadenv.js"); // load environment variables
      debug("asr cmd %o", cmd);

      let { provider, username, clientid, clientsecret, filepath } = cmd;

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

      if (typeof username === "boolean" || !username) {
        username = process.env["BOT_USERNAME"] || DEFAULT_USER;
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

      let pos = true;
      let nbest = N_BEST_DEFAULT;

      debug(
        "[connect] clientId %s, userName %s, secret ***, provider %s, nbest %s, pos %s",
        clientid,
        username,
        provider,
        nbest,
        pos
      );

      if (clientid && username) {
        let client = null;
        if (provider) {
          client = new Bot(clientid, clientsecret, provider);
        } else {
          client = new Bot(clientid, clientsecret);
        }

        let resp = await client.command("POST", "/asr/recognize", {
          filepath: filepath, // 语音文件位置，必填
          nbest: nbest, // 取得最佳识别结果 topN, 默认 5
          pos: pos, // 返回结果是否分词，默认 false
          fromUserId: username, // 记录发送语音的用户唯一标识 ID，可选，默认 无
        });

        logger.log(JSON.stringify(resp, null, " "));
      }
    });
};
