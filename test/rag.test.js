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
        `\nChatbot#command("${method}", "${path}", ${payload ? "payload" : "null"
        }) \n<-[body]- \n%s\n -[result]->\n%s \n`,
        JSON.stringify(payload || {}, null, " "),
        JSON.stringify(resp, null, " ")
    );
};

const moduleName = "RAG 知识库";

test.before(async (t) => {
    const chatbot = new Chatbot(clientId, clientSecret, botProvider);
    t.context.chatbot = chatbot;
    t.pass();
});

test.only(`${moduleName}#query`, async (t) => {
    let method = "post";
    let path = "/rag/query";
    let payload = {
        query: "海南有几个机场"
    };

    let resp = await t.context.chatbot.command(method, path, payload);
    print(method, path, payload, resp);

    // resp: 
    //   {
    //     "rc": 0,
    //     "data": {
    //      "think": null, // 机器人推理内容
    //      "content": "海南有三个民用机场：海口美兰国际机场、三亚凤凰国际机场和琼海博鳌机场。", // 机器人回复内容
    //      "is_logic_fallback": false, // 是否解答问题：1）false - 已经解答; 2) true - 未能解答
    //      "slices": [ // RAG 知识库文档分片信息
    //       {
    //        "slice_id": "68b56ea7d168833da385810c",
    //        "distance": 0.12809044122695923,
    //        "certainty": 0.9359548091888428,
    //        "text": "海口有海口美兰国际机场，位于海口市美兰区，航线飞往国内大中城市，也有飞往国际的专机。从海口去美兰国际机场，除了地铁快速到达外，有绕城高速直达，还有琼文高速和223国道，交通非常便利。海南有三个民用机场：海口美兰国际机场、三亚凤凰国际机场和琼海博鳌机场。",
    //        "filename": null
    //       }
    //      ],
    //      "model": "qwen2.5:14b", // 本次问答使用的模型
    //      "prompt": "1. 使用下面的上下文信息回答末尾的问题\n2. 如果你不知道，就说\"I_DONT_KNOW\", 不要胡说.\n3. 让答案尽量的简洁，只用3、4个句子回答问题.\n\n上下文信息: \n海口有海口美兰国际机场，位于海口市美兰区，航线飞往国内大中城市，也有飞往国际的专机。从海口去美兰国际机场，除了地铁快速到达外，有绕城高速直达，还有琼文高速和223国道，交通非常便利。海南有三个民用机场：海口美兰国际机场、三亚凤凰国际机场和琼海博鳌机场。\n\n\n问题: 海南有几个机场\n答案:" // 系统提示词
    //     }
    //    }
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
