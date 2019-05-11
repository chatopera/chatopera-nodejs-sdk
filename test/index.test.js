const test = require("ava");
const debug = require("debug")("chatopera:sdk:test");
const generate = require("../src/generate-authorization");
const Chatbot = require("../index");
const clientId = "5cd29bf76ffd6400173e0189";
const clientSecret = "0d8e43cc4de22e9e2cb89f6924fc96e7";
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
