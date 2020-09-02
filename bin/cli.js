#!/usr/bin/env node
/**
 * Copyright 2020 Chatopera Inc. <https://www.chatopera.com>. All rights reserved.
 * This software and related documentation are provided under a license agreement containing
 * restrictions on use and disclosure and are protected by intellectual property laws.
 * Except as expressly permitted in your license agreement or allowed by law, you may not use,
 * copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform,
 * publish, or display any part, in any form, or by any means. Reverse engineering, disassembly,
 * or decompilation of this software, unless required by law for interoperability, is prohibited.
 */
const program = require("commander");

if (!process.env.TZ) process.env.TZ = "Asia/Shanghai";

// main function
async function main() {
  await require("./connect")(program);
  await require("./deploy")(program);
  await require("./trace")(program);
  await require("./asr")(program);

  program.version(require("../package.json").version).parse(process.argv);
}

// on main entry
if (require.main === module) {
  (async function () {
    await main();
  })();
}
