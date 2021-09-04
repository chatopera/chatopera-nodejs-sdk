const inquirer = require("inquirer");
const debug = require("debug")("chatopera:sdk:cli");
const { Option } = require("commander");
const Bot = require("../index.js").Chatbot;
const fs = require("fs");
const moment = require("moment-timezone");
const logger = require("../lib/logger");
const _ = require("lodash");

async function faqImport(payload) {
  debug("[faqImport] payload %s", payload);
  let DATA = null;

  try {
    // 绝对路径或当前文件的相对路径
    DATA = require(payload.filepath);
  } catch {
    // 相对于 cwd 的绝对路径
    DATA = require(require("path").join(process.cwd(), payload.filepath));
  }

  if (!DATA) {
    logger.error("Can not load data with " + payload.filepath);
    process.exit(1);
  }

  // 检查数据
  for (let i of DATA) {
    let { categories, post, replies, enabled, similarQuestions } = i;
    let pass = !!post;

    if (replies && replies.length > 0) {
      _.forEach(replies, (r) => {
        if (r.rtype == "hyperlink") {
          if (!(r.title && r.url)) {
            pass = false;
          }
        } else {
          if (!r.content) {
            pass = false;
          }
        }
      });
    } else {
      pass = false;
    }

    if (!pass) {
      logger.error("问题和答案必填");
      process.exit(1);
    }
  }

  // upload faq data
  let client = null;
  if (payload.provider) {
    client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
  } else {
    client = new Bot(payload.clientid, payload.clientsecret);
  }

  try {
    let index = 0;
    let count = DATA.length;
    for (let item of DATA) {
      try {
        let {
          docId,
          categories: categoryTexts,
          post,
          replies,
          enabled,
          similarQuestions,
        } = item;

        let exts = similarQuestions || [];

        _.forEach(replies, (r) => {
          r.enabled = true;
        });

        const getFaq = async () =>
          await client.command("GET", `/faq/database/${docId}`);

        const createFaq = async () =>
          await client.command("POST", `/faq/database`, {
            docId,
            post,
            replies,
            categoryTexts,
            enabled,
          });

        const updateFaq = async (replyLastUpdate) =>
          await client.command("PUT", `/faq/database/${docId}`, {
            post,
            replies,
            categoryTexts,
            enabled,
            replyLastUpdate,
          });

        let p = docId
          ? getFaq().then((result) => {
              if (result.rc !== 0) {
                return createFaq();
              } else {
                return updateFaq(result.data.replyLastUpdate);
              }
            })
          : createFaq();

        let { data, rc } = await p;

        const cleanExt = async (id) =>
          await client
            .command("GET", `/faq/database/${id}/extend`)
            .then(async ({ data: { rc, data: extend } }) => {
              if (extend) {
                for (let e of extend) {
                  await client.command(
                    "delete",
                    `/faq/database/${id}/extend/${e.id}`
                  );
                }
              }
            });

        if (rc == 0) {
          await cleanExt(data.id);
          for (let ext of exts) {
            await client.command("POST", `/faq/database/${data.id}/extend`, {
              post: ext,
            });
          }
        }

        index++;

        if (count > 300) {
          if (index / 300 == 0) {
            logger.info(`  Processed data %s/%s: %s...`, index, count, post);
          }
        } else {
          logger.info(`  Processed data %s/%s: %s ...`, index, count, post);
        }
      } catch (e) {
        logger.error(e);
        logger.error(`问题 ${item.post} 上传失败`);
        process.exit(1);
      }
    }
    logger.log(`${payload.filepath} 上传成功`);
  } catch (e) {
    logger.error("上传失败", e);
    process.exit(1);
  }
}

async function faqExport(payload) {
  debug("[faqExport] payload %s", payload);
  let client = null;
  if (payload.provider) {
    client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
  } else {
    client = new Bot(payload.clientid, payload.clientsecret);
  }

  let { data: categoriesMetadata } = await client.command(
    "GET",
    "/faq/categories"
  );
  let result = await client.command("GET", "/faq/database/export");

  if (result && result.rc == 0) {
    let data = _.map(result.data, (r) => {
      let [docId, categories, enabled, post, replies, ...exts] = r;

      if (!_.isArray(categories)) {
        categories = [];
      }

      let categoryTexts = [];
      for (let c of categories) {
        let select = _.find(categoriesMetadata, { value: c });
        if (select) {
          categoryTexts.push(select.label);
          categoriesMetadata = select.children;
        }
      }

      return {
        docId,
        categories: categoryTexts,
        enabled: enabled,
        post: post,
        replies: _.map(replies, (r) => {
          delete r.enabled;
          return r;
        }),
        similarQuestions: exts,
      };
    });

    fs.writeFileSync(payload.filepath, JSON.stringify(data, null, 2));
    logger.log(`${payload.filepath} file saved, data size ${data.length}`);
  } else {
    logger.error("faq export error", JSON.stringify(result));
  }
}

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("faq")
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
      new Option(
        "-a, --action <value>",
        "Client Secret of the bot, optional, default null"
      ).choices(["import", "export"])
    )
    .option(
      "-f, --filepath [value]",
      "Export to file path or import with file path"
    )
    .action(async (cmd) => {
      require("./env.js"); // load environment variables
      debug("connect cmd %o", cmd);

      let { provider, clientid, clientsecret, action, filepath } = cmd;

      if (typeof clientid === "boolean" || !clientid) {
        clientid = process.env["BOT_CLIENT_ID"];
        if (!clientid) {
          logger.error(
            "[Error] Invalid clientid, set it with cli param `-c CLIENT_ID` or .env file"
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

      if (action == "import") {
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
      } else {
        // for export
        if (typeof filepath === "boolean" || !filepath) {
          // generate a file
          filepath = require("path").join(
            process.cwd(),
            `faq.pairs.${moment()
              .tz(process.env.TZ)
              .format("YYYY_MM_DD_HHmmss")}.json`
          );
        }

        if (fs.existsSync(filepath)) {
          logger.error(`${filepath} file exist`);
          process.exit(1);
        }
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
        await faqImport(payload);
      } else {
        await faqExport(payload);
      }
    });
};
