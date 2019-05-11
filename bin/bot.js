#!/usr/bin/env node

const program = require("commander");
const inquirer = require("inquirer");
const Bot = require("../index.js");
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
  .action(cmd => {
    debug("connect cmd %o", cmd);

    let { provider, username, clientid, clientsecret } = cmd;

    if (!!provider) {
      console.log(">> connect to " + provider + " ...");
    } else {
      console.log(">> connect to https://bot.chatopera.com ...");
    }

    debug(
      "connect clientId %s, userName %s, secret %s, provider %s",
      clientid,
      username,
      clientsecret,
      provider
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
          .then(function(answers) {
            client
              .conversation(username, answers.send)
              .then(res => {
                console.log(res);
                console.log("Bot:", res.string);
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
  .action(async cmd => {
    let { provider, clientid, botarchive, clientsecret } = cmd;

    if (!!provider) {
      console.log(">> connect to " + provider + " ...");
    } else {
      console.log(">> connect to https://bot.chatopera.com ...");
    }

    if (fs.existsSync(botarchive)) {
      let isDirectory = fs.lstatSync(botarchive).isDirectory();
      let tempc66 = null;
      let isRemoveC66 = false;
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
      new Bot(clientid, clientsecret, provider);
    } else {
      client = new Bot(clientid, clientsecret);
    }
    // submit file
    let result = await client.deployConversation(tempc66);
    debug("deploy: result %o", result);

    if (isRemoveC66) {
      // remove temp file
      fs.unlink(tempc66, err => {
        if (err) {
          console.error(err);
          return;
        }
        debug("%s removed.", tempc66);
      });
    }
  });

program.version(require("../package.json").version).parse(process.argv);
