require("dotenv").config();
const test = require("ava");
const debug = require("debug")("chatopera:sdk:test");
const { ChatoperaAdmin } = require('../index')
const accessToken = process.env["BOT_ACCESS_TOKEN"];
const botProvider = process.env["BOT_PROVIDER"];

const moduleName = "管理员";

test.before(async (t) => {
    const admin = new ChatoperaAdmin(accessToken, botProvider);
    t.context.admin = admin;
    t.pass();
});

test("Test create chatbot", async (t) => {
    let resp = await t.context.admin.command('POST', '/chatbot', {
        description: "Test",
        logo: "",
        name: "TestBot" + Date.now(),
        primaryLanguage: "zh_CN",
        trans_zhCN_ZhTw2ZhCn: false,
    });
    debug("chatbot %j", resp);
    t.is(resp.rc, 0);
    t.pass();
});

test("Test get chatbots", async (t) => {
    let resp = await t.context.admin.command('GET', '/chatbot');
    debug("chatbots %j", resp);
    t.is(resp.rc, 0);
    t.pass();
});