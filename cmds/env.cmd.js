#!/usr/bin/env node
// -*- coding: utf-8 -*-
//===============================================================================
//
// Copyright (c) 2020 <> All Rights Reserved
//
//
// File: /Users/hain/chatopera/chatopera-nodejs-sdk/bin/env.js
// Author: Hai Liang Wang
// Date: 2020-09-05:12:00:06
//
//===============================================================================
/**
 *
 */
const argv = process.argv;
const basedir = __dirname;
const workdir = process.cwd();
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const ENV_FILE = ".env";
const readlineq = require("readlineq").default;
const logger = require("../lib/logger");

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command("env")
    .description(
      "chat with bot via bot#conversation interface, https://dwz.chatopera.com/T0CZ0R"
    )
    .option("--project-dir [value]", "Path to generate .env file, default is process.cwd()")
    .action(async (cmd) => {

      let { projectDir } = cmd;

      if (typeof projectDir === "boolean" || !projectDir) {
        projectDir = workdir;
      }

      if (!fs.existsSync(projectDir)) {
        logger.error("--project-dir should an existed folder path");
        process.exit(1);
      }

      let envfilepath = path.join(projectDir, ENV_FILE);
      let defaults = ["# Chatopera BOT Platform",
        "BOT_PROVIDER=https://bot.chatopera.com",
        "BOT_CLIENT_ID=",
        "BOT_CLIENT_SECRET=",
        "BOT_THRESHOLD_FAQ_BEST_REPLY=0.9",
        "BOT_THRESHOLD_FAQ_SUGG_REPLY=0",
        "BOT_ACCESS_TOKEN="];

      if (fs.existsSync(envfilepath)) {
        logger.warn(`${envfilepath} file exist, append following lines if needed.`);
        for (let x of defaults) {
          console.log(`   ${x}`);
        }
        console.log("Get details about configurations, https://docs.chatopera.com/products/chatbot-platform/howto-guides/integration/cli-install-config.html")
        process.exit(0);
      }

      readlineq(envfilepath, defaults.join("\n"));
      logger.info(`.env file[${envfilepath}] is generated. Get details about configurations, https://docs.chatopera.com/products/chatbot-platform/howto-guides/integration/cli-install-config.html`)
    });
};

