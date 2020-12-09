/**
 * Chatopera Node.js SDK
 * Copyright 2020 Chatopera Inc. <https://www.cskefu.com>. All rights reserved.
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
const clientId = process.env["BOT_CLIENT_ID"];
const clientSecret = process.env["BOT_CLIENT_SECRET"];
const botProvider = process.env["BOT_PROVIDER"];

const print = function (method, path, payload, resp) {
  debug(
    `\nChatbot#command("${method}", "${path}", ${
      payload ? "payload" : "null"
    }) \n<-[body]- \n%s\n -[result]->\n%s \n`,
    JSON.stringify(payload || {}, null, " "),
    JSON.stringify(resp, null, " ")
  );
};

test.before(async (t) => {
  const chatbot = new Chatbot(clientId, clientSecret, botProvider);
  t.context.chatbot = chatbot;
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
