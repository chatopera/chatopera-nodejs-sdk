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

const print = function (method, path, payload, resp) {
  debug(
    `\nChatbot#command("${method}", "${path}", ${
      payload ? "payload" : "null"
    }) \n<-[body]- \n%s\n -[result]->\n%s \n`,
    JSON.stringify(payload || {}, null, " "),
    JSON.stringify(resp, null, " ")
  );
};

const moduleName = "知识库";

test.before(async (t) => {
  const chatbot = new Chatbot(clientId, clientSecret, botProvider);
  t.context.chatbot = chatbot;
  t.pass();
});

test("Test query faq", async (t) => {
  let resp = await t.context.chatbot.faq("nodesdk", "你好");
  debug("faq %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});

test.only(`${moduleName}#创建问答对`, async (t) => {
  let method = "post";
  let path = "/faq/database";
  let payload = {
    post: "如何查看快递单号",
    replies: [
      {
        rtype: "plain",
        content: "foo",
        enabled: true,
      },
      {
        rtype: "plain",
        content: "bar",
        enabled: true,
      },
    ],
    enabled: true,
    categoryTexts: ["一级分类名", "二级分类名"],
  };

  let resp = await t.context.chatbot.command(method, path, payload);
  print(method, path, payload, resp);
  t.is(resp.rc, 0);
  t.pass();
});

// test(`${moduleName}#`, async (t) => {
//     let method = "";
//     let path = "";
//     let payload = null;

//     let resp = await t.context.chatbot.command(method, path, payload);
//     print(method, path, payload, resp);
//     t.is(resp.rc, 0);
//     t.pass();
// });
