const debug = require("debug")("chatopera:sdk:handler:project");
const fs = require("fs");
const path = require("path");
const Chatopera = require("../chatopera");
const { InvalidArgumentError } = require("commander");
const { DEFAULT_BOT_PROVIDER, DEFAULT_CACHED_DIR, appendFileLines } = require("../lib/utils");
const readlineq = require('readlineq').default;
const { getCurrentEnvFile, parseEnvFile } = require("../lib/loadenv");
const { exportConversations } = require("./conversation.handler");

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

        let botPullResult = await pullBotProject(payload);

        // TODO handel result and merge into botInfo
    } else {
        console.log(JSON.stringify(botInfo, null, " "));
        throw new Error("Unexpected response for bot create.");
    }

    return botInfo;
}

/**
 * Pull Bot Project from BotProvider
 * @param {*} payload 
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
    const tmpDir = path.join(payload.projectDir, DEFAULT_CACHED_DIR, "pullWorkTmp");
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
    let exportSucc = await exportConversations(payload);
    debug("exportSucc %s", exportSucc);
}


const pushBotProject = async (payload) => {

}



module.exports = exports = {
    create: createBotProject,
    pull: pullBotProject,
    push: pushBotProject,
}