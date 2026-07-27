const debug = require("debug")("chatopera:sdk:handler:trace");
const Bot = require("../index.js").Chatbot;
const logger = require("../lib/logger.js");
const moment = require("moment-timezone");

/**
 * Get bot's loggings
 * @param {*} clientId 
 * @param {*} secret 
 * @param {*} provider 
 * @param {*} logLevel 
 * @param {*} afterDate 
 * @returns 
 */
function fetchTraceLog(clientId, secret, provider, logLevel, afterDate) {
    return new Promise((resolve, reject) => {
        let client = null;
        if (provider) {
            client = new Bot(clientId, secret, provider);
        } else {
            client = new Bot(clientId, secret);
        }

        client
            .command("POST", "/conversation/trace", {
                logLevel: logLevel,
                afterDate: afterDate,
            })
            .then((res) => {
                if (res.rc === 0 && res.data && res.data.length > 0) {
                    resolve({
                        afterDate,
                        data: res.data,
                    });
                } else {
                    // 没有得到数据
                    resolve({
                        afterDate,
                    });
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
}

module.exports = exports = {
    fetchTraceLog,
}