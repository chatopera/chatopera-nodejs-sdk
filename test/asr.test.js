#!/usr/bin/env node
// -*- coding: utf-8 -*-
//===============================================================================
//
// Copyright (c) 2020 <> All Rights Reserved
//
//
// File: /Users/hain/chatopera/chatopera-nodejs-sdk/test/asr.test.js
// Author: Hai Liang Wang
// Date: 2020-09-02:11:44:08
//
//===============================================================================
/**
 *
 */
require("dotenv").config();
const test = require("ava");
const curdir = __dirname;
const fs = require("fs");
const debug = require("debug")("chatopera:sdk:test:asr");
const { Chatbot } = require("../index");
const clientId = process.env["CLIENT_ID"];
const clientSecret = process.env["CLIENT_SECRET"];
const botProvider = process.env["BOT_PROVIDER"];

test.before(async (t) => {
  debug("bot: provider %s, clientId %s, secret ******", botProvider, clientId);
  const chatbot = new Chatbot(clientId, clientSecret, botProvider);
  t.context.chatbot = chatbot;
  t.pass();
});

test("Test asr request# reg file path", async (t) => {
  let resp = await t.context.chatbot.command("POST", "/asr/recognize", {
    filepath: curdir + "/fixtures/001.wav", // 语音文件位置，必填
    nbest: 3, // 取得最佳识别结果 topN, 默认 5
    pos: false, // 返回结果是否分词，默认 false
    fromUserId: "david", // 记录发送语音的用户唯一标识 ID，可选，默认 无
  });
  debug("asr [filepath] %j", resp);
  t.is(resp.rc, 0);
  // {
  //     "rc": 0,
  //         "data": {
  //         "duration": 6250,
  //             "predicts": [
  //                 {
  //                     "confidence": 0.960783,
  //                     "text": "上海浦东机场入境房输入全闭环管理"
  //                 },
  //                 {
  //                     "confidence": 0.960767,
  //                     "text": "上海浦东机场入境防输入全闭环管理"
  //                 },
  //                 {
  //                     "confidence": 0.960736,
  //                     "text": "上海浦东机场入境坊输入全闭环管理"
  //                 }
  //             ]
  //     }
  // }
  t.pass();
});

test.skip("Test encode wav to base64", async (t) => {
  // use `@chatopera/wavefile` for more advanced operations for
  // wav file before upload
  const WaveFile = require("@chatopera/wavefile");
  const f = fs.readFileSync(curdir + "/fixtures/001.wav");
  const prefix = "data:audio/wav;base64,";

  const wav1 = new WaveFile();
  wav1.fromBuffer(f);

  const wav = new WaveFile();
  wav.fromBase64(prefix + wav1.toBase64());

  t.pass();
});

test("Test asr request# reg base64 data", async (t) => {
  const f = fs.readFileSync(curdir + "/fixtures/001.wav");
  const prefix = "data:audio/wav;base64,";

  let resp = await t.context.chatbot.command("POST", "/asr/recognize", {
    type: "base64", // 语音文件位置，必填
    data: prefix + f.toString("base64"), // base64 data, `data:audio/wav;base64,`是必须的前缀
    nbest: 3, // 取得最佳识别结果 topN, 默认 5
    pos: false, // 返回结果是否分词，默认 false
    fromUserId: "david", // 记录发送语音的用户唯一标识 ID，可选，默认 无
  });
  debug("asr [base64] %j", resp);
  t.is(resp.rc, 0);
  t.pass();
});
