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

/**
 * 心智能 Skills
 */

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
