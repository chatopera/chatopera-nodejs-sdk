const test = require("ava");
const debug = require("debug")("chatopera:sdk:test");
const generate = require("../lib/generate-authorization");
const Chatbot = require("../index");
const clientId = "xxx";
const clientSecret = "xxx";
const path = require("path");
const curdir = __dirname;
// const host = "https://bot.chatopera.com";

test("Test generate token", async t => {
  const token = generate(
    clientId,
    clientSecret,
    "POST",
    `/api/v1/chatbot/${clientId}/faq/database`
  );
  console.log("token", token);
  t.pass();
});

test("Test get chatbot detail by Id", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  try {
    let resp = await chatbot.detail();
    debug("detail %o, bot name: %s", resp, resp["name"]);
    t.pass();
  } catch (e) {
    debug("detail error %s", e);
    t.pass(e);
  }
});

test("Test query conversation", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.conversation("nodesdk", "hello");
  console.log("conversation", resp);
  t.pass();
});

test("Test query faq", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.faq("nodesdk", "what is your name");
  console.log("faq", resp);
  t.pass();
});

test("Test get user list", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.users();
  console.log("users", resp);
  t.pass();
});

test("Test get chat history", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.chats("nodesdk");
  console.log("chats", resp);
  t.pass();
});

test.skip("Test mute user", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.mute("nodesdk");
  console.log("mute", resp);
  t.pass();
});

test("Test unmute user", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.unmute("nodesdk");
  console.log("unmute", resp);
  t.pass();
});

test("Test ismute user", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.ismute("nodesdk");
  console.log("ismute", resp);
  t.pass();
});

test("Test deploy conversation c66", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  const c66 = path.join(curdir, "fixtures", "Eliza.1.0.0.c66");
  let resp = await chatbot.deployConversation(c66);
  console.log("deployConversation", resp);
  t.pass();
});

test("Test intent chat#create session", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  const session = await chatbot.intentSession("node007", "testclient");
  debug("intent session: %j", session);
  t.pass();
});

test("Test intent chat#get session detail", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  const session = await chatbot.intentSessionDetail(
    "3CC4CB8388981EB1E7F9C81C00000000"
  );
  debug("intent session: %j", session);
  t.pass();
});

test.only("Test intent chat", async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  const session = await chatbot.intentChat(
    "3CC4CB8388981EB1E7F9C81C00000000",
    "node007",
    "我想打车"
  );
  debug("intent session: %j", session);
  t.pass();
});
