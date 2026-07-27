const debug = require("debug")("chatopera:sdk:handler:project");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const Chatopera = require("../chatopera");
const { InvalidArgumentError } = require("commander");
const { DEFAULT_BOT_PROVIDER, DEFAULT_CACHED_DIR, appendFileLines, CHATOPERA_JSON_FNAME, readJSONFile, writeJSONFile, copyConsiderringOverwrite, DEFAULT_CACHED_WORKSDIR, removeFilenameExtension, CONVERSATION_NAME_PATTERN } = require("../lib/utils");
const readlineq = require('readlineq').default;
const { getCurrentEnvFile, parseEnvFile } = require("../lib/loadenv");
const { exportConversations, importConversations } = require("./conversation.handler");
const { ConversationExportError, ConversationImportError } = require("../lib/exceptions.js");
const detailsHandler = require("../handlers/details.handler.js");
const logger = require("../lib/logger.js");


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
    //     payload {
    //   provider: 'https://bot.chatopera.com',
    //   clientid: '6a66a645cb65b20013667d97',
    //   clientsecret: '91b783e833da232eb0ce1016724ee3f5',
    //   accessToken: undefined,
    //   primaryLanguage: undefined,
    //   botName: undefined,
    //   projectDir: '/home/hai/git/chatopera-nodejs-sdk/tmp/projectnew' }

    /**
     * BEFORE PUSH, CHECKS
     */
    if (!payload.projectDir) {
        throw new ConversationImportError("`projectdir` is required in payload for push task.");
    }

    if (!fs.existsSync(payload.projectDir)) {
        throw new ConversationImportError(`projectdir ${payload.projectDir} must exist.`);
    }

    let chatoperaJsonFilePath = path.join(payload.projectDir, "chatopera.json");
    if (!fs.existsSync(chatoperaJsonFilePath)) {
        throw new ConversationImportError("Chatopera JSON file[chatopera.json] not exist");
    }

    let chatoperaJson = await readJSONFile(chatoperaJsonFilePath);

    if (!("manifest" in chatoperaJson)) {
        throw new ConversationImportError("`manifest` info not exist in chatoperaJson");
    }

    let indexJson = chatoperaJson["manifest"];
    if (!_.isPlainObject(indexJson)) {
        throw new ConversationImportError("Invalid `manifest` object in chatopera.json");
    }

    // check clientid and secret
    let botInfo = await detailsHandler.getDetails(payload);

    if (("rc" in botInfo) && (botInfo.rc == 0)) {
        debug("[pushBotProject] bot exist and credentials works --> %o", botInfo);
        logger.log(`>> bot[${botInfo.data.name}] connected, start to push local files ...`);
        // check language settings, must match.
        // a bot can not change language after create.
        if (botInfo.data.primaryLanguage !== indexJson.primaryLanguage) {
            throw new ConversationImportError(`Can not import project, remote chatbot's lang[${botInfo.data.primaryLanguage}] does not match local settings[${indexJson.primaryLanguage}]`);
        }

        // TODO more checks of indexJson properties.
    } else {
        debug("[pushBotProject] response %s", botInfo);
        // { rc: 5, error: 'internal error' }, for invalid bot clientid
        // { rc: 1, error: 'invalid signature.' }, for invalid bot secret
        throw new ConversationImportError("Bot not exist or secret is incorrect.");
    }

    let pluginJsFilePath = path.join(payload.projectDir, "plugin.js");
    // set plugin.js as not required.
    // if (!fs.existsSync(pluginJsFilePath)) {
    //     throw new ConversationImportError("Plugin js file[plugin.js] not exist");
    // }

    /**
     * Now, do package
     */
    // check conversation files
    let conversationsDir = path.join(payload.projectDir, "conversations");
    let conversationFiles = [];
    let conversationsAfter = [];
    let conversationsAfterAdded = new Set();
    if (fs.existsSync(conversationsDir)) {
        conversationFiles = fs.readdirSync(conversationsDir, { withFileTypes: true })
            .filter(item => ((!item.isDirectory()) && item.name.endsWith(".ms")))
            .map(item => removeFilenameExtension(item.name, "ms"));

    }

    // Check file names, match [a-zA-Z0-9_]
    if (conversationFiles.length > 0) {
        for (let c of conversationFiles) {
            let matched = CONVERSATION_NAME_PATTERN.test(c);
            if (!matched) {
                throw new ConversationImportError(`conversation name [${c}] is illegal, use string with letter, number or _.`);
            }
        }
    }

    // remove conversation not exist in dir
    if (("conversations" in indexJson) && (_.isArray(indexJson["conversations"]))) {
        for (let c of indexJson["conversations"]) {
            if (conversationFiles.includes(c.name)) {
                conversationsAfter.push(c);
                conversationsAfterAdded.add(c.name);
            }
        }
    }

    // add new conversation
    for (let cName of conversationFiles) {
        if (!conversationsAfterAdded.has(cName)) {
            conversationsAfter.push({
                name: cName,
                enabled: true,
            });
            conversationsAfterAdded.add(cName);
        }
    }
    // sort with alphabetical order
    conversationsAfter.sort((a, b) => a.name > b.name ? 1 : -1);
    indexJson["conversations"] = conversationsAfter;

    /**
     * Now, start to copy files
     */
    const tmpDir = path.join(payload.projectDir, DEFAULT_CACHED_DIR, DEFAULT_CACHED_WORKSDIR, "push");

    // make sure tmpDir is empty
    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    fs.mkdirSync(tmpDir, { recursive: true, force: true });

    // write file index.json
    await writeJSONFile(path.join(tmpDir, "index.json"), indexJson);

    // write file plugin.js if exist
    if (fs.existsSync(pluginJsFilePath)) {
        copyConsiderringOverwrite(pluginJsFilePath, path.join(tmpDir, "plugin.js"));
    }

    // write conversations
    for (let c of conversationsAfterAdded) {
        copyConsiderringOverwrite(path.join(payload.projectDir, "conversations", c + ".ms"), path.join(tmpDir, `${indexJson.primaryLanguage}.${c}.ms`));
    }

    // import project
    let importResult = await importConversations(_.assign({}, payload, {
        filepath: tmpDir,
        tempDir: path.join(payload.projectDir, DEFAULT_CACHED_DIR, DEFAULT_CACHED_WORKSDIR)
    }));
    debug("[pushBotProject] importResult %o", importResult);
    return importResult;
}

module.exports = exports = {
    create: createBotProject,
    pull: pullBotProject,
    push: pushBotProject,
}