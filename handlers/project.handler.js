const debug = require("debug")("chatopera:sdk:handler:project");

/**
 * create a new project
 * @param {JSONObject} payload 
 * requires: 
 *  payload.accessToken
 * optional: 
 *  payload.provider [default: https://bot.chatopera.com]
 *  payload.primaryLanguage
 *  payload.botName
 * 
 */
const create = async (payload) => {
    debug("[create] payload %s", payload);
}

const pull = async (payload) => {

}


const push = async (payload) => {

}



module.exports = exports = {
    create,
    pull,
    push,
}