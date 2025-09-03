const inquirer = require("inquirer");
const debug = require("debug")("chatopera:sdk:cli");
const { Option } = require("commander");
const Bot = require("../index.js").Chatbot;
const fs = require("fs");
const moment = require("moment-timezone");
const logger = require("../lib/logger");
const _ = require("lodash");
const { sleep } = require("../lib/utils");


/**
 * Query RAG
 * @param {*} payload 
 */
async function ragQuery(payload) {
    // upload faq data
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let method = "post";
    let path = "/rag/query";
    let requestBody = {
        query: payload.text
    };

    let resp = await client.command(method, path, requestBody);

    if(resp.rc == 0){
        console.log("Bot's RAG Reply think>>", resp.data.think);
        console.log("Bot's RAG Reply content>>", resp.data.content);
        console.log("Bot's RAG Reply is fallback>>", resp.data.is_logic_fallback);
        console.log("Bot's RAG model>>", resp.data.model);
    }
}

exports = module.exports = (program) => {
    /**
     * Connect to a bot and start chat.
     */
    program
        .command("rag")
        .description("RAG Knowledge Base Command Tools")
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
                "query", // 检索 RAG 知识库
            ])
        )
        .option(
            "-t, --text [value]",
            "Query Text to interact with RAG"
          )
        .action(async (cmd) => {
            require("../lib/loadenv.js"); // load environment variables
            debug("connect cmd %o", cmd);

            let { provider, clientid, clientsecret, action, text } = cmd;

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
                    "error: option '-a, --action <value>' argument is invalid. Allowed choices are import, export, train, dropall."
                );
                process.exit(1);
            } else if (action == "query") {
                if (!text) {
                    logger.error(
                        `-t or --text TEXT is required in command line for RAG query.`
                    );
                    process.exit(1);
                }
            } else {
                logger.error(`Unexpected action ${action}`)
                process.exit(2);
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
                text,
            };

            if (action == "query") {
                await ragQuery(payload);
            }
        });
};
