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

test("Test get chatbot detail by Id", async (t) => {
  let method = "GET";
  let path = "/";
  let payload = null;
  let resp = await t.context.chatbot.command(method, path);
  print(method, path, payload, resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test update chatbot profile", async (t) => {
  let method = "PUT";
  let path = "/";
  let payload = {
    fallback: "请联系客服。",
    description: "我的超级能力是对话",
    welcome: "你好，我是机器人小巴巴",
  };

  let resp = await t.context.chatbot.command(method, path, payload);
  print(method, path, payload, resp);
  t.is(resp.rc, 0);
  t.pass();
});

test("Test get job status", async (t) => {
  let method = "GET";
  let path = "/status";
  let payload = null;

  let resp = await t.context.chatbot.command(method, path, payload);
  print(method, path, payload, resp);
  t.is(resp.rc, 0);
  t.pass();
});
