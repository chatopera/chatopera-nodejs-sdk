const inquirer = require("inquirer");
const debug = require("debug")("chatopera:sdk:cli");
const { Option } = require("commander");
const Bot = require("../index.js").Chatbot;
const fs = require("fs");
const moment = require("moment-timezone");
const logger = require("../lib/logger");
const _ = require("lodash");
const { sleep } = require("../lib/utils.js");

/**
 * 在意图识别、FAQ 和多轮对话上，同步近义词词典
 * @param {*} payload
 */
async function dictsSync(payload) {
  let client = null;
  if (payload.provider) {
    client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
  } else {
    client = new Bot(payload.clientid, payload.clientsecret);
  }

  /**
   * 同步多轮对话
   */
  let result = await client.command("POST", "/conversation/sync/customdicts");
  if (result && result.rc == 0) {
    // 正常，并且已经完成
    logger.log("  Conversations have been synchronized.");
  } else {
    logger.error("  Fail to synchronize Conversations. ERROR", result);
  }

  /**
   * 同步知识库
   */
  result = await client.command("GET", "/");

  logger.log("  Start to sync faq ...");
  if (result && result.rc == 0) {
    if (result.data.status.reindex == 2) {
      result = await client.command("POST", "/faq/sync/customdicts");
      if (result && result.rc == 0) {
        // 正常，在异步执行，检查
        let loop = true;
        while (loop) {
          await sleep();
          let result2 = await client.command("GET", "/");

          if (result2 && result2.data.status.reindex == 0) {
            loop = false;
            logger.log("  Faq has been synchronized.");
          } else if (result2 && result2.data.status.reindex == 1) {
            // 同步中
          } else {
            // 其他异常
            logger.error("  Fail to synchronize Faq. ERROR", result2);
            loop = false;
          }
        }
      } else {
        logger.error("  Fail to synchronize Faq. ERROR", result2);
      }
    } else if (result.data.status.reindex == 0) {
      logger.log(
        "[WARN]",
        "Faq is synchronized with Dicts, no need to do it again."
      );
    } else {
      logger.log(
        "[WARN]",
        "Faq is syncing, no need to send another request, or you can command again later to force reindex."
      );
    }
  }

  /**
   * 意图识别同步
   */
  // 执行训练
  logger.log("  Start to train model for dev branch ...");

  result = await client.command("POST", "/clause/devver/train");

  if (result && result.rc == 0) {
    let loop = true;
    while (loop) {
      // 等待状态
      await sleep();

      // 检查状态
      let result2 = await client.command("GET", "/clause/devver/build");

      if (result2 && result2.rc == 0) {
        logger.log("  Train works done successfully.");
        loop = false;
      } else if (result2 && result2.rc == 2) {
        logger.log("  Train in progress ...");
      } else {
        // errors
        logger.error("Error happens during training", result2);
        process.exit(1);
      }
    }
  } else {
    logger.error("Fails to train model for dev branch", e);
    process.exit(1);
  }
}

async function dictsImport(payload) {
  logger.log(
    "Notice: import opersation maybe override data for the target bot, should better do an export operation before to backup the previous data."
  );
  debug("[dictsImport] payload %j", payload);
  let DATA = null;

  try {
    // 绝对路径或当前文件的相对路径
    DATA = require(payload.filepath);
  } catch {
    // 相对于 cwd 的绝对路径
    DATA = require(require("path").join(process.cwd(), payload.filepath));
  }

  if (DATA) {
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

    // 引用系统词典
    if (DATA["sysdicts"] && _.isObject(DATA["sysdicts"])) {
      let keys = _.keys(DATA["sysdicts"]);
      for (let key of keys) {
        if (DATA["sysdicts"][key]["referred"]) {
          let result = await client.command("POST", "/clause/sysdicts/ref", {
            sysdict: {
              name: key,
            },
          });
          if (result && (result.rc == 0 || result.rc == 2)) {
            continue;
          } else {
            logger.log("[ERROR]", result);
            process.exit(1);
          }
        }
      }
    }

    // 处理自定义词典: 正则表达式词典
    if (DATA["patterndicts"] && _.isObject(DATA["patterndicts"])) {
      let keys = _.keys(DATA["patterndicts"]);
      for (let key of keys) {
        let val = DATA["patterndicts"][key];

        try {
          // 先尝试创建
          let result = await client.command("POST", "/clause/customdicts", {
            name: key,
            type: "regex",
          });
          //   debug("POST /clause/customdicts result", result);
        } catch (e) {
          debug("error", e);
        }

        // 进行更新
        let result = await client.command(
          "PUT",
          `/clause/customdicts/${key}/pattern`,
          {
            patterns: val["patterns"],
          }
        );

        // 检查更新结果
        if (result && result.rc == 0) {
          continue;
        } else {
          logger.log("[ERROR]", result);
          process.exit(1);
        }
      }
    }

    // 处理自定义词典: 词条词典
    if (DATA["vocabdicts"] && _.isObject(DATA["vocabdicts"])) {
      let keys = _.keys(DATA["vocabdicts"]);
      for (let key of keys) {
        // val 是词条数组
        let values = DATA["vocabdicts"][key];

        // 先尝试创建词典
        try {
          // 先尝试创建
          let result = await client.command("POST", "/clause/customdicts", {
            name: key,
            type: "vocab",
          });
          //   debug("POST /clause/customdicts result", result);
        } catch (e) {
          debug("error", e);
        }

        // 处理词条
        let body = {
          customdict: { name: key },
          delete: [],
          post: [],
        };

        for (let val of values) {
          body.delete.push({
            word: val["word"],
          });
          body.post.push({
            word: val["word"],
            synonyms: val["synonyms"],
          });
        }

        let result = await client.command(
          "PUT",
          "/clause/dictwords?sync=all",
          body
        );

        // 检查更新结果
        if (result && result.rc == 0) {
          continue;
        } else {
          logger.log("[ERROR]", result);
          process.exit(1);
        }
      }
    }

    logger.log("Dicts is imported  successfully.");
  } else {
    logger.error("Can not load data with " + payload.filepath);
    process.exit(1);
  }
}

/**
 * 增加正则表达式词典信息
 * @param {*} payload
 * @param {*} ret
 */
async function patchRegexDictData(bot, payload, ret) {
  let result = await bot.command(
    "GET",
    `/clause/customdicts/${payload.name}/pattern`
  );

  if (result && result.rc == 0) {
    ret["patterndicts"][payload.name] = result.data;
  }
}

/**
 * 自定义词汇表词典
 * @param {*} bot
 * @param {*} payload
 * @param {*} ret
 */
async function patchVocabDictData(bot, payload, ret) {
  let result = await bot.command(
    "GET",
    `/clause/dictwords?customdict=${payload.name}&page=1&limit=100`
  );

  if (result && result.rc == 0) {
    ret["vocabdicts"][payload.name] = result.data;
  } else {
    logger.log("[ERROR]", result);
    process.exit(1);
  }

  // 翻页
  if (result.current_page !== result.total_page) {
    let remain = result.total_page - result.current_page;
    for (let i = 0; i < remain; i++) {
      result = await bot.command(
        "GET",
        `/clause/dictwords?customdict=${payload.name}&page=${i + 2}&limit=100`
      );

      if (result && result.rc == 0) {
        ret["vocabdicts"][payload.name] = _.concat(
          ret["vocabdicts"][payload.name],
          result.data
        );
      } else {
        logger.log("[ERROR]", result);
        process.exit(1);
      }
    }
  }
}

async function dictsExport(payload) {
  debug("[dictsExport] payload %j", payload);
  let client = null;
  if (payload.provider) {
    client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
  } else {
    client = new Bot(payload.clientid, payload.clientsecret);
  }

  let output = {
    sysdicts: {},
    patterndicts: {},
    vocabdicts: {},
  };

  try {
    // sys dicts
    let sysdictsResult = await client.command(
      "GET",
      "/clause/sysdicts?limit=9999&page=1"
    );

    // debug("sysdicts", sysdictsResult);
    if (sysdictsResult && sysdictsResult.rc == 0) {
      output.sysdicts = _.keyBy(sysdictsResult.data, "name");
    }

    // custom dicts
    let customDicts = await client.command(
      "GET",
      "/clause/customdicts?limit=9999&page=1"
    );

    if (customDicts && customDicts.rc == 0) {
      for (let x of customDicts.data) {
        if (x.type == "regex") {
          await patchRegexDictData(client, x, output);
        } else if (x.type == "vocab") {
          await patchVocabDictData(client, x, output);
        }
      }
    }

    fs.writeFileSync(payload.filepath, JSON.stringify(output, null, 2));
    logger.log(`${payload.filepath} file saved.`);
  } catch (e) {
    logger.error("dicts export error", e);
    process.exit(1);
  }
}

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("dicts")
    .description("sync, import or export a bot's dicts data")
    .option("-c, --clientid [value]", "ClientId of the bot")
    .option(
      "-s, --clientsecret [value]",
      "Client Secret of the bot, optional, default null"
    )
    .option(
      "-p, --provider [value]",
      "Chatopera Bot Service URL, optional, default https://bot.chatopera.com"
    )
    .addOption(
      new Option("-a, --action <value>", "Operation action").choices([
        "import",
        "export",
        "sync",
      ])
    )
    .option(
      "-f, --filepath [value]",
      "Export json data to file path or import json data with file path"
    )
    .action(async (cmd) => {
      require("./env.js"); // load environment variables
      debug("connect cmd %o", cmd);

      let { provider, clientid, clientsecret, action, filepath } = cmd;

      if (typeof clientid === "boolean" || !clientid) {
        clientid = process.env["BOT_CLIENT_ID"];
        if (!clientid) {
          logger.error(
            "[Error] Invalid clientid, set it with cli param `-c BOT_CLIENT_ID` or .env file"
          );
          process.exit(1);
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

      if (action == undefined) {
        logger.error(
          "error: option '-a, --action <value>' argument is invalid. Allowed choices are import, export."
        );
        process.exit(1);
      } else if (action == "import") {
        if (!filepath) {
          logger.error(
            `-f or --filepath FILE_PATH is required in command line for importing faq.`
          );
          process.exit(1);
        }

        if (!fs.existsSync(filepath)) {
          logger.error(`${filepath} not found.`);
          process.exit(1);
        } else if (!filepath.endsWith(".json")) {
          logger.error(
            `${filepath} is not end with .json, it has to be in JSON format and ends with .json`
          );
          process.exit(1);
        }
      } else if (action == "export") {
        // for export
        if (typeof filepath === "boolean" || !filepath) {
          // generate a file
          filepath = require("path").join(
            process.cwd(),
            `bot.dicts.${moment()
              .tz(process.env.TZ)
              .format("YYYY_MM_DD_HHmmss")}.json`
          );
        }

        if (fs.existsSync(filepath)) {
          logger.error(`${filepath} file exist`);
          process.exit(1);
        }
      } else {
        // sync
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

      let payload = {
        provider,
        clientid,
        clientsecret,
        action,
        filepath,
        format: "json", // currently, for import and export, only in json format.
      };

      if (action == "import") {
        await dictsImport(payload);
      } else if (action == "export") {
        await dictsExport(payload);
      } else {
        // for sync
        await dictsSync(payload);
      }
    });
};
