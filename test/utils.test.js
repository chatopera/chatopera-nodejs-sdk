/**
 * Chatopera Node.js SDK
 * Copyright (2020-2026) Chatopera Inc. <https://www.chatopera.com>. All rights reserved.
 * This software and related documentation are provided under a license agreement containing
 * restrictions on use and disclosure and are protected by intellectual property laws.
 * Except as expressly permitted in your license agreement or allowed by law, you may not use,
 * copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform,
 * publish, or display any part, in any form, or by any means. Reverse engineering, disassembly,
 * or decompilation of this software, unless required by law for interoperability, is prohibited.
 */
require("dotenv").config();
const test = require("ava").default;
const curdir = __dirname;
const debug = require("debug")("chatopera:sdk:test");
const utils = require("../lib/utils");
const path = require("path");

const moduleName = "Utils"

test.only(`${moduleName}#zip`, async (t) => {

    let sourceDir = path.join(curdir, "..", "test\\fixtures");
    let outputZip = path.join(curdir, "..", "tmp\\a.zip");
    
    await utils.zipDirectory(sourceDir, outputZip);
    t.pass()
})
