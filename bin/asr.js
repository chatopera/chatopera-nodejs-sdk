const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;

const N_BEST_DEFAULT = 3;

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("asr")
    .option("-c, --clientid <value>", "ClientId of the bot, *required.")
    .option("-u, --username <value>", "Username to chat with bot, *required.")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null"
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .option("-f, --file <value>", "Target file to recognize, *required.")
    .action(async (cmd) => {
      debug("asr cmd %o", cmd);

      let { provider, username, clientid, clientsecret, file } = cmd;

      if (typeof clientsecret === "boolean") {
        clientsecret = null;
      }

      if (typeof provider === "boolean") {
        provider = null;
      }

      let pos = true;
      let nbest = N_BEST_DEFAULT;

      if (!!provider) {
        console.log(">> connect to " + provider + " ...");
      } else {
        console.log(">> connect to https://bot.chatopera.com ...");
      }

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
          filepath: file, // 语音文件位置，必填
          nbest: nbest, // 取得最佳识别结果 topN, 默认 5
          pos: pos, // 返回结果是否分词，默认 false
          fromUserId: username, // 记录发送语音的用户唯一标识 ID，可选，默认 无
        });

        console.log(JSON.stringify(resp, null, " "));
      }
    });
};