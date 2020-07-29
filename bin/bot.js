#!/usr/bin/env node

const program = require("commander");
const inquirer = require("inquirer");
const Bot = require("../index.js").Chatbot;
const tempdir = require("../lib/tempdir");
const path = require("path");
const fs = require("fs");
const debug = require("debug")("chatopera:sdk:cli");
const utils = require("../lib/utils.js");
const moment = require("moment-timezone");

if (!process.env.TZ) process.env.TZ = "Asia/Shanghai";

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

    let { provider, username, clientid, clientsecret, faqBest, faqSugg } = cmd;

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
    "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
  )
  .action(async (cmd) => {
    let { provider, clientid, botarchive, clientsecret } = cmd;

    if (typeof clientsecret === "boolean") {
      clientsecret = null;
    }

    if (typeof provider === "boolean") {
      provider = null;
    }

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

const TRACE_IDS = new Set();

function traceLoop(client, logLevel, afterDate) {
  return new Promise((resolve, reject) => {
    client
      .command("POST", "/conversation/trace", {
        logLevel: logLevel,
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
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Trace logs for bot.
 */
program
  .command("trace")
  .option("-c, --clientid <value>", "ClientId of the bot, *required.")
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
    debug("connect cmd %o", cmd);

    let { provider, clientid, clientsecret, logLevel } = cmd;

    if (typeof clientsecret === "boolean") {
      clientsecret = null;
    }

    if (typeof provider === "boolean") {
      provider = null;
    }

    if (typeof logLevel === "boolean") {
      logLevel = "DEBUG";
    }

    if (!!provider) {
      console.log(">> connect to " + provider + " ...");
    } else {
      console.log(">> connect to https://bot.chatopera.com ...");
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

program.version(require("../package.json").version).parse(process.argv);
