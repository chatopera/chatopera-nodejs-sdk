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
