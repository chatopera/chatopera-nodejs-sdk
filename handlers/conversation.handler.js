const debug = require("debug")("chatopera:sdk:handler:conversation");
const fs = require("fs");
const path = require("path");
const Bot = require("../index.js").Chatbot;
const readlineq = require("readlineq").default;
const logger = require("../lib/logger.js");
const tempdir = require("../lib/tempdir.js");
const utils = require("../lib/utils.js");
const { ConversationImportError } = require("../lib/exceptions.js");

/**
 * 导出 Chatopera 机器人平台多轮对话
 * @param {*} payload
 */
async function exportConversations(payload) {
    if ((payload.archiveC66) && (fs.existsSync(payload.filepath))) {
        logger.error(`File ${payload.filepath} exists.`);
        return false;
    }

    logger.log("[exportConversations] payload", payload);

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
            let tempDirC66 = payload.tempDirC66;

            if (!tempDirC66) {
                let ts = utils.getTimestamp();
                tempDirC66 = path.join(tempdir, data.name.replace(/\*/g, "_") + "." + ts);
                payload.tempDirC66 = tempDirC66;
            }

            if (!fs.existsSync(tempDirC66)) {
                fs.mkdirSync(tempDirC66, {
                    recursive: true,
                });
            }

            // plugin.js
            let plugin = [];
            for (let x of data.plugin) {
                plugin.push(x + "\n");
            }
            readlineq(path.join(tempDirC66, "plugin.js"), plugin);
            delete data["plugin"];

            // conversations
            for (let x of data.conversations) {
                let lines = [];

                for (let y of x.script.split("\n")) {
                    lines.push(y + "\n");
                }

                readlineq(
                    path.join(tempDirC66, data.primaryLanguage + "." + x.name + ".ms"),
                    lines
                );

                delete x["script"];
            }

            // index.json
            fs.writeFileSync(
                path.join(tempDirC66, "index.json"),
                JSON.stringify(data, null, 2)
            );

            /**
             * Process Conversation JSON
             */
            if (payload.archiveC66) {
                await utils.zipDirectory(tempDirC66, payload.filepath);
                logger.log(`File ${payload.filepath} is saved.`);
            }

            if (!payload.keepTmpDirC66) {
                try {
                    fs.rmSync(tempDirC66, { recursive: true, force: true });
                } catch (e) {
                    //
                }
            }
        } else {
            logger.error("Unexpected result", result);
        }
    } catch (e) {
        logger.error(e);
        return false;
    }
    return payload;
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
            let tmpDirPath = payload.tempDir ? payload.tempDir : tempdir;
            tempc66 = path.join(tmpDirPath, pkg.name + "." + ts + ".c66");

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

    if (("rc" in result) && (result["rc"] == 0)) {
        return true;
    } else {
        throw new ConversationImportError(JSON.stringify(result));
    }
}

module.exports = exports = {
    exportConversations,
    importConversations
}