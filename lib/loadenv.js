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
 
 function resolveEnvFile(dirpath) {
   console.log("dirpath", dirpath);
   let filepath = path.join(dirpath, ENV_FILE);
 
   if (fs.existsSync(filepath)) {
     return filepath;
   } else {
     let nextFilepath = path.dirname(dirpath);
     if (nextFilepath === dirpath) return null;
     return resolveEnvFile(nextFilepath);
   }
 }
 
 try {
   let envfile = resolveEnvFile(workdir);
 
   if (envfile) {
     console.log(">> load env file %s ... ", envfile);
     const envConfig = dotenv.parse(fs.readFileSync(envfile));
     for (const k in envConfig) {
       process.env[k] = envConfig[k];
     }
   }
 } catch (e) {
   // pass
   // ignore any error
 }