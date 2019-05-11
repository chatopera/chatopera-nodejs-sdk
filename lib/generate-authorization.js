const crypto = require("crypto");
const debug = require("debug")("chatopera:sdk:generator");

const hmacSha1 = (secret, text) =>
  crypto
    .createHmac("sha1", secret)
    .update(text)
    .digest("hex");

const json2base64 = obj =>
  Buffer.from(JSON.stringify(obj), "utf8").toString("base64");

/**
 *
 * @param {*} appId
 * @param {*} secret
 * @param {*} method POST,GET,**
 * @param {*} path /api/v1/chatbot/5bb63be6d499797cb4eaa3c0
 */
const generate = (appId, secret, method, path) => {
  // bypass auth if appId or secret not present.
  if (appId == null || secret == null) {
    debug("[WARN] appId or secret not present.");
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.round(Math.random() * 10000000000);
  let signature = hmacSha1(
    secret,
    `${appId}${timestamp}${random}${method}${path}`
  );

  return json2base64({ appId, timestamp, random, signature });
};

module.exports = generate;
