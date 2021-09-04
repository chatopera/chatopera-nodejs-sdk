const debug = require("debug")("chatopera:sdk:cli");
const Bot = require("../index.js").Chatbot;
const tempdir = require("../lib/tempdir");
const path = require("path");
const fs = require("fs");
const utils = require("../lib/utils.js");
const { Option } = require("commander");
const logger = require("../lib/logger");
const moment = require("moment-timezone");
const readlineq = require("readlineq");

/**
 * 导出 Chatopera 机器人平台多轮对话
 * @param {*} payload
 */
async function exportConversations(payload) {
  if (!fs.existsSync(payload.filepath)) {
    logger.log("export", payload);

    // upload faq data
    let client = null;
    if (payload.provider) {
      client = new Bot(
        payload.clientid,
        payload.clientsecret,
        payload.provider
      );
    } else {
      client = new Bot(payload.clientid, payload.clientsecret);
    }

    try {
      let result = await client.command("POST", "/conversation/json/export");

      if (result && result.rc == 0) {
        let data = result.data;

        // a path for store files and then compress as c66
        let ts = utils.getTimestamp();
        let tempc66 = path.join(tempdir, data.name + "." + ts);

        fs.mkdirSync(tempc66, {
          recursive: true,
        });

        // plugin.js
        let plugin = [];
        for (let x of data.plugin) {
          plugin.push(x + "\n");
        }
        await readlineq(path.join(tempc66, "plugin.js"), plugin);
        delete data["plugin"];

        // conversations
        for (let x of data.conversations) {
          let lines = [];

          for (let y of x.script.split("\n")) {
            lines.push(y + "\n");
          }

          await readlineq(
            path.join(tempc66, data.primaryLanguage + "." + x.name + ".ms"),
            lines
          );

          delete x["script"];
        }

        // index.json
        fs.writeFileSync(
          path.join(tempc66, "index.json"),
          JSON.stringify(data, null, 2)
        );

        /**
         * Process Conversation JSON
         */
        await utils.zipDirectory(tempc66, payload.filepath);
        try {
          fs.unlinkSync(tempc66);
        } catch (e) {
          //
        }

        logger.log(`File ${payload.filepath} is saved.`);
      } else {
        logger.error("Unexpected result", result);
      }
    } catch (e) {
      logger.error(e);
    }
  } else {
    logger.error(`File ${payload.filepath} exists.`);
    process.exit(1);
  }
}

/**
 * 导入本地多轮对话文件到 Chatopera 机器人平台
 * @param {*} payload
 */
async function importConversations(payload) {
  logger.log(
    "Notice: import opersation maybe override data for the target bot, should better do an export operation before to backup the previous data."
  );
  let tempc66 = null;
  let isRemoveC66 = false;
  if (fs.existsSync(payload.filepath)) {
    let isDirectory = fs.lstatSync(payload.filepath).isDirectory();
    if (!isDirectory && payload.filepath.endsWith(".c66")) {
      // 直接推送
      tempc66 = payload.filepath;
    } else if (isDirectory) {
      if (!path.isAbsolute(payload.filepath)) {
        payload.filepath = path.join(process.cwd(), payload.filepath);
      }

      let pkg = require(payload.filepath + "/index.json");
      debug("name: %s", pkg.name);

      // compress filepath to zip
      let ts = utils.getTimestamp();
      tempc66 = path.join(tempdir, pkg.name + "." + ts + ".c66");

      await utils.zipDirectory(payload.filepath, tempc66);
      debug("Import generate temp file %s", tempc66);
      isRemoveC66 = true;
    } else {
      logger.error("filepath invalid file/directory format.");
      process.exit(1);
    }
  } else {
    logger.error("filepath path not exist.");
    process.exit(1);
  }

  let client = null;
  if (payload.provider) {
    client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
  } else {
    client = new Bot(payload.clientid, payload.clientsecret);
  }
  // submit file
  let result = await client.deployConversation(tempc66);
  logger.log("Import response %o", result);

  if (isRemoveC66) {
    // remove temp file
    fs.unlink(tempc66, (err) => {
      if (err) {
        logger.error(err);
        return;
      }
      debug("%s removed.", tempc66);
    });
  }
}

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
      require("./env.js"); // load environment variables
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
          filepath = require("path").join(
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
