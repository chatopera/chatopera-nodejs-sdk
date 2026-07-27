const debug = require("debug")("chatopera:sdk:handler:rag");
const Bot = require("../index.js").Chatbot;

/**
 * Query RAG
 * @param {*} payload 
 */
async function ragQuery(payload) {
    // upload faq data
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let method = "post";
    let path = "/rag/query";
    let requestBody = {
        query: payload.text
    };

    let resp = await client.command(method, path, requestBody);
    return resp;
}


module.exports = exports = {
    ragQuery,
}