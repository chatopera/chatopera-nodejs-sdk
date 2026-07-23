const debug = require("debug")("chatopera:sdk:cli:project");
const Bot = require("../index.js").Chatbot;
const { InvalidArgumentError, Option } = require("commander");
const logger = require("../lib/logger");
const { DEFAULT_BOT_PROVIDER } = require("../lib/utils.js");
const handler = require("../handlers/project.handler.js");

exports = module.exports = async (program) => {
    /**
     * Deploy bot archives for conversations
     */
    program
        .command("project")
        .description("Chatopera Bot Project Management Commands.")
        .option("-c, --clientid [value]", "ClientId of the bot")
        .option(
            "-s, --clientsecret [value]",
            "Client Secret of the bot, optional, default null."
        )
        .option(
            "-p, --provider [value]",
            "Chatopera Bot Service URL, optional, default " + DEFAULT_BOT_PROVIDER
        )
        .option(
            "--access-token [value]",
            "Personal Access Token, get it from https://bot.chatopera.com/dashboard/accesssettings"
        )
        .addOption(
            new Option("-a, --action <value>", "Operation action").choices([
                "create", // 创建新的机器人，依赖于 access token, botProvider
                "pull", // 下载机器人语料，依赖于 clientId, secret, botProvider
                "push", // 上传机器人语料，依赖于 clientId, secret, botProvider
            ])
        )
        .option(
            "--bot-name [value]",
            "Name of chatbot"
        )
        .addOption(
            new Option("--bot-lang [value]", "Bot's primary language").choices([
                "zh_CN", // 简体中文
                "zh_TW", // 繁体中文
                "en_US", // 英语
                "ja", // 日语
                "th", // 泰语
            ])
        )
        .action(async (cmd) => {
            require("../lib/loadenv.js"); // load environment variables
            let { provider, clientid, clientsecret, accessToken, action, botName, botLang } = cmd;

            // 检查是否有 bot provider 和 accessToken
            if (typeof provider === "boolean" || !provider) {
                provider = process.env["BOT_PROVIDER"];
            }

            if (!!provider) {
                logger.log(
                    ">> set BotProvider to %s ...",
                    provider
                );
            } else {
                provider = DEFAULT_BOT_PROVIDER;
                logger.log(
                    ">> set BotProvider to https://bot.chatopera.com ..."
                );
            }

            if (typeof accessToken === "boolean" || !accessToken) {
                accessToken = process.env["BOT_ACCESS_TOKEN"];
            }


            if (["push", "pull"].includes(action)) {
                // 对于 push 和 pull, 必须有 clientId 和 secret
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
            } else if (["create"].includes(action)) {
                // 对于 push 和 pull, 必须有 botProvider 和 accessToken
                // 如果恰好有了 clientid 和 secret 将会被忽略
                debug("acc", accessToken, "provider", provider)
                if ((!accessToken) || (!provider)) {
                    throw new InvalidArgumentError(`Invalid argvs for ${action} action, accessToken and botProvider are required.`);
                }

                // 读取 bot lang, bot name.
                // TODO
            } else {
                throw new InvalidArgumentError("action is illegal.")
            }

            // Call handler for specific job
            let payload = { provider, clientid, clientsecret, accessToken, botLang, botName };
            await handler[action].call(null, payload);
        });
};
