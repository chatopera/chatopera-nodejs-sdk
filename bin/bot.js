#!/usr/bin/env node

const program = require("commander");
const inquirer = require("inquirer");
const Bot = require("../index.js").Chatbot;
const tempdir = require("../lib/tempdir");
const path = require("path");
const fs = require("fs");
const debug = require("debug")("chatopera:sdk:cli");
const utils = require("../lib/utils.js");

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
    "Chatopera Superbrain Instance URL, optional, default https://bot.chatopera.com"
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

    let { provider, username, clientid, clientsecret, faqBest, faqSugg } = cmd;

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

      let prompt = () => {
        inquirer
          .prompt({ name: "send", message: "Text" })
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

/**
 * Deploy bot archives for conversations
 */
program
  .command("deploy")
  .option("-c, --clientid <value>", "ClientId of the bot, *required.")
  .option("-b, --botarchive <value>", "Conversation Bundle, *required.")
  .option(
    "-s, --clientsecret [value]",
    "Client Secret of the bot, optional, default null."
  )
  .option(
    "-p, --provider [value]",
    "Chatopera Superbrain Instance URL, optional, default https://bot.chatopera.com"
  )
  .action(async (cmd) => {
    let { provider, clientid, botarchive, clientsecret } = cmd;

    if (!!provider) {
      console.log(">> connect to " + provider + " ...");
    } else {
      console.log(">> connect to https://bot.chatopera.com ...");
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

program.version(require("../package.json").version).parse(process.argv);
