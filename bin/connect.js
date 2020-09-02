const inquirer = require("inquirer");
const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("connect")
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
    .option(
      "-fb, --faq-best [value]",
      "FAQ best reply threshold, optional, default 0.8"
    )
    .option(
      "-fs, --faq-sugg [value]",
      "FAQ suggest reply threshold, optional, default 0.6"
    )
    .action((cmd) => {
      debug("connect cmd %o", cmd);

      let {
        provider,
        username,
        clientid,
        clientsecret,
        faqBest,
        faqSugg,
      } = cmd;

      if (typeof clientsecret === "boolean") {
        clientsecret = null;
      }

      if (typeof provider === "boolean") {
        provider = null;
      }

      try {
        faqBest = Number(faqBest);
        faqSugg = Number(faqSugg);

        if (faqBest == 0) {
          throw new Error(
            "WARN: faqBest must larger then 0, use default value instead."
          );
        }
      } catch (e) {
        console.log("Invalid --faq-best, --faq-sugg value", e);
      }

      if (!faqBest) {
        faqBest = 0.8;
      }

      if (!faqSugg) {
        faqSugg = 0.6;
      }

      try {
        if (faqBest > 1 || faqBest <= 0) {
          throw new Error("--faq-best should range in [0,1]");
        }

        if (faqSugg > 1 || faqSugg <= 0) {
          throw new Error("--faq-sugg should range in [0,1]");
        }

        if (faqBest <= faqSugg) {
          throw new Error("faq-best must larger then faq-sugg");
        }
      } catch (e) {
        console.log("Invalid --faq-best, --faq-sugg value", e);
        process.exit(1);
      }

      if (!!provider) {
        console.log(">> connect to " + provider + " ...");
      } else {
        console.log(">> connect to https://bot.chatopera.com ...");
      }

      debug(
        "[connect] clientId %s, userName %s, secret %s, provider %s",
        clientid,
        username,
        clientsecret,
        provider
      );

      console.log(
        "[connect] FAQ Best Reply Threshold %s, Suggest Reply Threshold %s",
        faqBest,
        faqSugg
      );

      if (clientid && username) {
        let client = null;
        if (provider) {
          client = new Bot(clientid, clientsecret, provider);
        } else {
          client = new Bot(clientid, clientsecret);
        }
        const inquirerCommandPrompt = require("inquirer-command-prompt");
        const path = require("path");

        // 历史查询，加快输入
        // https://github.com/sullof/inquirer-command-prompt
        const homedir = require("os").homedir();
        const historyFolder = path.join(homedir, ".cache", "chatopera", "sdk");
        inquirerCommandPrompt.setConfig({
          history: {
            save: true,
            folder: historyFolder,
            limit: 20,
            blacklist: ["exit"],
          },
        });

        inquirer.registerPrompt("command", inquirerCommandPrompt);

        let prompt = () => {
          inquirer
            .prompt({
              type: "command",
              name: "send",
              message: "Text",
              autoCompletion: ["__kickoff", "__faq_hot_list"],
              context: 0,
              short: false,
            })
            .then(function (answers) {
              client
                .command("POST", "/conversation/query", {
                  fromUserId: username,
                  textMessage: answers.send,
                  isDebug: false,
                  faqBestReplyThreshold: faqBest,
                  faqSuggReplyThreshold: faqSugg,
                })
                .then((res) => {
                  console.log(JSON.stringify(res, null, " "));
                  if (res && res.rc === 0) {
                    console.log("Bot:", res.data.string);
                  }
                })
                .catch(console.error)
                .then(() => {
                  prompt();
                });
            });
        };

        prompt();
      } else {
        console.error(
          "clientId and username is required, secret is optional for Private Deployment."
        );
      }
    });
};
