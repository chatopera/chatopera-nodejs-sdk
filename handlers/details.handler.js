const Bot = require("../index.js").Chatbot;


/**
 * Get bot details
 * @param {*} payload 
 * @returns 
 */
const getDetails = async (payload) => {
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let data = await client.command("GET", "/");
    return data;
}


module.exports = exports = {
    getDetails
}