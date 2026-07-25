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
const debug = require("debug")("chatopera:sdk:loadenv");
const argv = process.argv;
const basedir = __dirname;
const workdir = process.cwd();
const dotenv = require("dotenv");
const readlineq = require('readlineq').default;
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const ENV_FILE = ".env";
const PREDEFINED_ENV_FILE_KEY = "CHATOPERA_BOT_ENVFILE"

function resolveEnvFile(dirpath) {

  let filepath = path.join(dirpath, ENV_FILE);

  if (fs.existsSync(filepath)) {
    return filepath;
  } else {
    let nextFilepath = path.dirname(dirpath);
    if (nextFilepath === dirpath) return null;
    return resolveEnvFile(nextFilepath);
  }
}

/**
 * Parse file as envfile, return object.
 * Not enject into process.env
 * @param {*} filepath 
 * @returns 
 */
function parseEnvFile(filepath) {
  let lines = readlineq(filepath);
  let env = {}
  for (let x of lines) {
    let y = _.trim(x);
    if (y.startsWith("#") || y.startsWith("//") || y.startsWith("/**")) {
      continue;
    }

    if (y.includes("=")) {
      let splits = y.split('=')
      let envkey = splits[0];
      let envval = splits.slice(1).join("=");

      if (envval) {
        env[envkey] = envval;
      }
    }
  }

  return env;
}

/**
 * Get envfile by checking current workdir
 * @returns 
 */
function getCurrentEnvFile() {
  let envfile = resolveEnvFile(workdir);
  return envfile;
}


try {
  let envfile = null;
  if ((PREDEFINED_ENV_FILE_KEY in process.env) && (process.env[PREDEFINED_ENV_FILE_KEY])) {
    envfile = _.trim(process.env[PREDEFINED_ENV_FILE_KEY]);
    console.log("[loadenv] resolve from ENV " + PREDEFINED_ENV_FILE_KEY + ": " + envfile)
  } else {
    envfile = resolveEnvFile(workdir);
  }

  debug("envfile: %s", envfile);
  if (envfile) {
    console.log(">> load env file %s into process.env ... ", envfile);
    if (!fs.existsSync(envfile)) {
      console.error("[ERROR] envfile not exist[%s]", envfile);
    } else {
      const envConfig = dotenv.parse(fs.readFileSync(envfile));
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    }
  }
} catch (e) {
  // pass
  // ignore any error
}

module.exports = exports = {
  getCurrentEnvFile,
  parseEnvFile
}