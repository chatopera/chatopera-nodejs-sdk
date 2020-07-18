/**
 * Chatopera Node.js SDK
 * Copyright 2020 Chatopera Inc. <https://www.chatopera.com>. All rights reserved.
 * This software and related documentation are provided under a license agreement containing
 * restrictions on use and disclosure and are protected by intellectual property laws.
 * Except as expressly permitted in your license agreement or allowed by law, you may not use,
 * copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform,
 * publish, or display any part, in any form, or by any means. Reverse engineering, disassembly,
 * or decompilation of this software, unless required by law for interoperability, is prohibited.
 */
require("dotenv").config();
const test = require("ava");
const curdir = __dirname;
const debug = require("debug")("chatopera:sdk:test");
const generate = require("../lib/generate-authorization");
const { Chatbot } = require("../index");
const clientId = process.env["CLIENT_ID"];
const clientSecret = process.env["CLIENT_SECRET"];
const botProvider = process.env["BOT_PROVIDER"];

test.before(async (t) => {
  const chatbot = new Chatbot(clientId, clientSecret, botProvider);
  t.context.chatbot = chatbot;
  t.pass();
});

test("Test generate token", async (t) => {
  const token = generate(
    clientId,
    clientSecret,
    "POST",
    `/api/v1/chatbot/${clientId}/faq/database`
  );
  debug("token", token);
  t.truthy(token);
  t.pass();
});

test("Test get chatbot detail by Id", async (t) => {
  try {
    let resp = await t.context.chatbot.detail();
    debug("detail %o, bot name: %s", resp, resp["data"]["name"]);
    t.is(resp.rc, 0);
    t.pass();
  } catch (e) {
    debug("detail error %s", e);
    t.pass(e);
  }
});

test("Test query conversation", async (t) => {
  let resp = await t.context.chatbot.conversation("nodesdk", "hello");
  debug("conversation %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test query faq", async (t) => {
  let resp = await t.context.chatbot.faq("nodesdk", "你好");
  debug("faq %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test get user list", async (t) => {
  let resp = await t.context.chatbot.users();
  debug("users %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test get chat history", async (t) => {
  let resp = await t.context.chatbot.chats("nodesdk");
  debug("chats %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test.skip("Test mute user", async (t) => {
  let resp = await t.context.chatbot.mute("nodesdk");
  debug("mute %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test unmute user", async (t) => {
  let resp = await t.context.chatbot.unmute("nodesdk");
  debug("unmute %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test ismute user", async (t) => {
  let resp = await t.context.chatbot.ismute("nodesdk");
  debug("ismute %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test deploy conversation c66", async (t) => {
  const c66 = curdir + "/fixtures/小叮当-1.0.0-conversations.c66";
  let resp = await t.context.chatbot.deployConversation(c66);
  debug("deployConversation %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test intent chat#create session", async (t) => {
  const session = await t.context.chatbot.intentSession(
    "node007",
    "testclient"
  );
  debug("intent session: %j", session);
  t.is(session.rc, 0);

  const session2 = await t.context.chatbot.intentSessionDetail(session.data.id);
  debug("intent get session detail: %j", session2);
  t.is(session2.rc, 0);

  t.pass();
});

test("Test intent chat", async (t) => {
  const session = await t.context.chatbot.intentChat(
    "3CC4CB8388981EB1E7F9C81C00000000",
    "node007",
    "我想打车"
  );
  debug("intent chat: %j", session);
  t.is(session.rc, 11);
  t.pass();
});

test("Test psych#chat", async (t) => {
  let channel = "test";
  let channelId = "nodejs";
  let userId = "uid001";
  let textMessage = "确定自己是否有抑郁倾向，想要知道自己当下该怎么办";
  let resp = await t.context.chatbot.psychChat(
    channel,
    channelId,
    userId,
    textMessage
  );
  debug("resp: %s", JSON.stringify(resp, null, " "));
  t.is(resp.rc, 0);
  t.pass();
});

test("Test psych#search", async (t) => {
  let query = "确定自己是否有抑郁倾向，想要知道自己当下该怎么办";
  let threshold = 0.8;
  let resp = await t.context.chatbot.psychSearch(query, threshold);
  debug("resp: %s", JSON.stringify(resp, null, " "));
  t.is(resp.rc, 0);
  t.pass();
});
