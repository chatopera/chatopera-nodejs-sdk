const debug = require("debug")("chatopera:sdk:handler:project");
const fs = require("fs");
const path = require("path");
const Chatopera = require("../chatopera");
const { InvalidArgumentError } = require("commander");
const { DEFAULT_BOT_PROVIDER, DEFAULT_CACHED_DIR, appendFileLines, CHATOPERA_JSON_FNAME, readJSONFile, writeJSONFile, copyConsiderringOverwrite, DEFAULT_CACHED_WORKSDIR } = require("../lib/utils");
const readlineq = require('readlineq').default;
const { getCurrentEnvFile, parseEnvFile } = require("../lib/loadenv");
const { exportConversations } = require("./conversation.handler");
const { ConversationExportError } = require("../lib/exceptions.js");


/**
 * create a new project
 * @param {JSONObject} payload 
 * requires: 
 *  payload.accessToken
 * optional: 
 *  payload.provider [default: https://bot.chatopera.com]
 *  payload.primaryLanguage
 *  payload.botName
 * 
 */
const createBotProject = async (payload) => {
    debug("[createBotProject] payload %s", payload);
    //     {
    //   provider: 'https://bot.chatopera.com',
    //   clientid: undefined,
    //   clientsecret: undefined,
    //   accessToken: 'ss',
    //   primaryLanguage: 'zh_CN',
    //   botName: 'coi',
    //   projectDir: 'C:\\Users\\Administrator\\chatopera\\chatopera-nodejs-sdk\\tmp\\projectnew'
    // }

    // first, verify accessToken and botProvider
    if (!payload.provider) {
        payload.provider = DEFAULT_BOT_PROVIDER;
    }

    let chatopera = new Chatopera(payload.accessToken, payload.provider);

    let botInfo = await chatopera.command("POST", "/chatbot", {
        description: "Bot created with accessToken",
        logo: "",
        name: payload.botName,
        primaryLanguage: payload.primaryLanguage,
        trans_zhCN_ZhTw2ZhCn: false,
    });

    debug("chatbot %s", JSON.stringify(botInfo, null, " "));
    // chatbot {
    //  "rc": 0,
    //  "data": {
    //   "clientId": "6a641190f8261",
    //   "secret": "faf165cdb2d07cd",
    //   "name": "coi",
    //   "description": "Bot created with accessToken",
    //   "primaryLanguage": "zh_CN",
    //   "createdAt": "Sat Jul 25 2026 09:29:52 GMT+0800 (China Standard Time)"
    //  }
    // }

    if (/*无效 accessToken*/("rc" in botInfo) && (botInfo["rc"] == 5)) {
        throw new InvalidArgumentError("Invalid accessToken.");
    } else if (/*succ*/ ("rc" in botInfo) && (botInfo["rc"] == 0)) {
        // pull bot in projectDir
        payload.clientid = botInfo.data.clientId;
        payload.clientsecret = botInfo.data.secret;
        botInfo = await pullBotProject(payload);
        console.log(">> Bot project is created sucessfully -->", botInfo.projectDir)
        console.log(">> Read README.md file in " + botInfo.projectDir + " to get start.")
    } else {
        console.log(JSON.stringify(botInfo, null, " "));
        throw new Error("Unexpected response for bot create.");
    }

    return botInfo;
}

/**
 * Pull Bot Project from BotProvider
 * @param {*} payload 
 *   Required:
 *         * payload.projectDir: 将项目下载的根目录
 *         * payload.clientid
 *         * payload.clientsecret
 *   Optional:
 *         * payload.provider: default https://bot.chatopera.com
 */
const pullBotProject = async (payload) => {
    debug("[pullBotProject] payload %s", payload);

    /**
     * First, check projectDir and init
     */
    if (!payload.projectDir) {
        throw new Error("Project dir not present in payload");
    }

    if (!fs.existsSync(payload.projectDir)) {
        fs.mkdirSync(payload.projectDir, { recursive: true });
    }

    // create tmp dir
    const tmpDir = path.join(payload.projectDir, DEFAULT_CACHED_DIR, DEFAULT_CACHED_WORKSDIR, "pull");
    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
    payload.tempDirC66 = tmpDir;
    payload.archiveC66 = false;
    payload.keepTmpDirC66 = true;

    /**
     * Second, parse clientId and secret into .env
     */
    let envfile = path.join(payload.projectDir, ".env");
    let envfileExist = false;
    let env = {};
    if (fs.existsSync(envfile)) {
        envfileExist = true;
        env = parseEnvFile(envfile);
    }

    let tobeSavedLines = [];
    if ((!env["BOT_PROVIDER"]) || (env["BOT_PROVIDER"] !== payload.provider)) {
        tobeSavedLines.push("BOT_PROVIDER=" + payload.provider);
    }

    if ((!env["BOT_CLIENT_ID"]) || (env["BOT_CLIENT_ID"] !== payload.clientid)) {
        tobeSavedLines.push("BOT_CLIENT_ID=" + payload.clientid);
    }

    if ((!env["BOT_CLIENT_SECRET"]) || (env["BOT_CLIENT_SECRET"] !== payload.clientsecret)) {
        tobeSavedLines.push("BOT_CLIENT_SECRET=" + payload.clientsecret);
    }

    if (tobeSavedLines.length > 0) {
        appendFileLines(envfile, ["\r\n", "# AUTO GENERATED WITH CHATOPERA CLI"].concat(tobeSavedLines));
    }

    /**
     * Download c66 files to tmpDir 
     */
    let exportResult = await exportConversations(payload);
    debug("exportResult %s", exportResult);

    if (!exportResult) {
        // export conversations fails
        throw new ConversationExportError("Fail to export conversations.");
    }

    /**
     * 导出成功，重新建立项目文件夹
     */
    const tempDirC66 = exportResult.tempDirC66;

    // 重构 chatopera.json 文件: 合并，如果有 chatopera.json 文件，就只更新其中的 manifest
    const chatoperaJsonFpath = path.join(payload.projectDir, CHATOPERA_JSON_FNAME)
    let chatoperaJson = {};

    if (fs.existsSync(chatoperaJsonFpath)) {
        chatoperaJson = await readJSONFile(chatoperaJsonFpath);
    }

    const indexJson = await readJSONFile(path.join(tempDirC66, "index.json"));
    chatoperaJson["manifest"] = indexJson;

    // save chatopera json
    await writeJSONFile(chatoperaJsonFpath, chatoperaJson);

    // 复制 plugin.js 文件
    const pluginJsFpath = path.join(payload.projectDir, "plugin.js");
    const tmpPluginJsFpath = path.join(tempDirC66, "plugin.js");
    copyConsiderringOverwrite(tmpPluginJsFpath, pluginJsFpath);

    // 复制 conversations 文件
    // 建立文件夹
    const conversationsDir = path.join(payload.projectDir, "conversations");
    if (fs.existsSync(conversationsDir)) {
        fs.rmSync(conversationsDir, { recursive: true, force: true })
    }
    fs.mkdirSync(conversationsDir);

    // 复制 scripts 文件
    if ("conversations" in indexJson) {
        for (let c of indexJson["conversations"]) {
            let cName = c["name"];
            let cEnabled = c["enabled"];
            let cScriptFilePath = path.join(tempDirC66, indexJson["primaryLanguage"] + "." + cName + ".ms");
            copyConsiderringOverwrite(cScriptFilePath, path.join(conversationsDir, cName + ".ms"));
        }
    }

    // create README.md
    readlineq(path.join(payload.projectDir, "README.md"), [
        "# Bot Project\n",
        "Get more info with [LINK](https://docs.chatopera.com/products/chatbot-platform/tutorials/index.html).\n"
    ])

    // at last, return chatopera json in payload
    payload["chatopera"] = chatoperaJson;
    return payload;
}

/**
 * Push conversations into provider
 * @param {*} payload 
 */
const pushBotProject = async (payload) => {
    debug("[pushBotProject] payload %s", payload);
}



module.exports = exports = {
    create: createBotProject,
    pull: pullBotProject,
    push: pushBotProject,
}