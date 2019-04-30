/**
 * Chatopera Node.js SDK
 */
const client = require("./src/client");
const debug = require("debug")("chatopera:sdk:index");

function Chatbot(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
}


function _parseResponse(response) {
    if (response.rc == 0) {
        return response.data;
    } else {
        throw new Error(response.msg || response.error);
    }
}

Chatbot.prototype.detail = async function() {
    let response = await client.getChatbotById(this.clientId, this.clientSecret);
    return _parseResponse(response);
};


Chatbot.prototype.conversation = async function(userId, textMessage, isDebug = false) {
    let response = await client.queryConversation(this.clientId, this.clientSecret, {
        fromUserId: userId,
        textMessage: textMessage,
        isDebug: isDebug
    });
    return _parseResponse(response);
}

Chatbot.prototype.faq = async function(userId, textMessage) {
    let response = await client.queryFaq(this.clientId, this.clientSecret, {
        fromUserId: userId,
        query: textMessage
    });
    return _parseResponse(response);
}

Chatbot.prototype.users = async function(limit = 50, page = 1, sortby = "-lasttime") {
    let response = await client.getUserList(this.clientId, this.clientSecret, page, limit, sortby);
    return _parseResponse(response);

}

Chatbot.prototype.chats = async function(userId, limit = 50, page = 1) {
    let response = await client.getUserChatHistoryList(this.clientId, this.clientSecret, userId, page, limit);
    if (response.rc == 0) {
        delete response['rc'];
        return response;
    } else {
        throw new Error(response.msg || response.error);
    }
}


Chatbot.prototype.mute = async function(userId) {
    let response = await client.muteUserById(this.clientId, this.clientSecret, userId);
    return _parseResponse(response);
}

Chatbot.prototype.unmute = async function(userId) {
    let response = await client.unmuteUserById(this.clientId, this.clientSecret, userId);
    return _parseResponse(response);
}

Chatbot.prototype.ismute = async function(userId) {
    let response = await client.ismuteUserById(this.clientId, this.clientSecret, userId);
    return _parseResponse(response)['mute'];
}

Chatbot.prototype.deployConversation = async function(botarchive) {
    let response = await client.deployConversationArchive(this.clientId, this.clientSecret, {
        c66: botarchive
    });
    return _parseResponse(JSON.parse(response.text));
}

if (typeof window === 'object') {
    window.Chatbot = Chatbot;
}

exports = module.exports = Chatbot;