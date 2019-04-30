/**
 * Chatbot API
 */
const debug = require('debug')('chatopera:sdk:chatbot');
const axios = require('axios');
const url = require('url');
const fs = require('fs');
const superagent = require('superagent');

const baseURL = process.env['SUPERBRAIN_PROXY_URL'] ?
    (() => {
        let q = url.parse(process.env['SUPERBRAIN_PROXY_URL']);
        return `${q.protocol}//${q.host}`;
    })() :
    'https://bot.chatopera.com';
const basePath = '/api/v1/chatbot';
const generate = require('./generate-authorization');

const METHOD_POST = 'POST';
const METHOD_GET = 'GET';
const METHOD_DELETE = 'DELETE';
const METHOD_PUT = 'PUT';
const METHOD_PATCH = 'PATCH';

console.log('[chatopera] set chatbot engine baseURL', baseURL);

const request = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json',
    // `transformResponse` allows changes to the response data to be made before
    // it is passed to then/catch
    transformResponse: [
        function(data) {
            // remove chatbotID
            data = JSON.parse(data);
            if (data.data) {
                if (data.data.chatbotID) {
                    delete data.data.chatbotID;
                } else if (Array.isArray(data.data)) {
                    for (let x in data.data) {
                        delete data.data[x].chatbotID;
                    }
                }
            }
            return data;
        },
    ],
});

function _resp(send) {
    return send.then(
        resp => {
            if (resp.status === 200) {
                return resp.data;
            }
            throw resp.data || new Error(`error, statusCode ${resp.status}`);
        },
        err => {
            throw err;
        }
    );
}

function Client() {}

/**
 * 通过ChatbotID获得聊天机器人详情
 * @param  {[type]} clientId [description]
 * @return {[type]}           [description]
 */
Client.prototype.getChatbotById = function(clientId, secret) {
    debug('getChatbotById: %s, %s', clientId, secret);
    let path = `${basePath}/${clientId}`;
    return _resp(
        request.get(path, {
            headers: {
                Authorization: generate(clientId, secret, METHOD_GET, path),
            },
        })
    );
};

/**
 * 创建问答对
 * @param  {[type]} clientId [description]
 * @param  {[type]} data      [description]
 * @return {[type]}           [description]
 */
Client.prototype.createFaqPair = function(clientId, data) {
    return _resp(request.post(`${basePath}/${clientId}/faq/database`, data));
};

Client.prototype.getFaqPairDetail = function(clientId, docId) {
    return _resp(request.get(`${basePath}/${clientId}/faq/database/${docId}`));
};

/**
 * 更新Faq问答对
 * @param  {[type]} clientId [description]
 * @param  {[type]} docId     [description]
 * @param  {[type]} data      [description]
 * @return {[type]}           [description]
 */
Client.prototype.updateFaqPair = function(clientId, docId, data) {
    return _resp(
        request.put(`${basePath}/${clientId}/faq/database/${docId}`, data)
    );
};

/**
 * 查询Faq知识库列表
 * @param  {[type]} clientId [description]
 * @param  {Number} page      [description]
 * @param  {Number} limit     [description]
 * @return {[type]}           [description]
 */
Client.prototype.getFaqPairs = function(clientId, page = 1, limit = 30) {
    return _resp(
        request.get(
            `${basePath}/${clientId}/faq/database?page=${page}&limit=${limit}`
        )
    );
};

/**
 * 删除问答对
 * @param  {[type]} clientId [description]
 * @param  {[type]} docId     [description]
 * @return {[type]}           [description]
 */
Client.prototype.delFaqPair = function(clientId, docId) {
    return _resp(request.delete(`${basePath}/${clientId}/faq/database/${docId}`));
};

/**
 * 创建扩展问
 * @param  {[type]} clientId [description]
 * @param  {[type]} data      [description]
 * @return {[type]}           [description]
 */
Client.prototype.createFaqPairExtend = function(clientId, docId, data) {
    return _resp(
        request.post(`${basePath}/${clientId}/faq/database/${docId}/extend`, data)
    );
};

/**
 * 查询扩展问
 * @param  {[type]} clientId [description]
 * @param  {[type]} docId     [description]
 * @return {[type]}           [description]
 */
Client.prototype.getFaqPairExtends = function(clientId, docId) {
    return _resp(
        request.get(`${basePath}/${clientId}/faq/database/${docId}/extend`)
    );
};

/**
 * 更新扩展问
 * @param  {[type]} clientId [description]
 * @param  {[type]} docId     [description]
 * @param  {[type]} extendId  [description]
 * @param  {[type]} data      [description]
 * @return {[type]}           [description]
 */
Client.prototype.updateFaqPairExtend = function(
    clientId,
    docId,
    extendId,
    data
) {
    return _resp(
        request.put(
            `${basePath}/${clientId}/faq/database/${docId}/extend/${extendId}`,
            data
        )
    );
};

/**
 * 删除FAQ扩展问
 *
 * @return {[type]} [description]
 */
Client.prototype.delFaqPairExtend = function(clientId, docId, extendId) {
    return _resp(
        request.delete(
            `${basePath}/${clientId}/faq/database/${docId}/extend/${extendId}`
        )
    );
};

/**
 * 创建近义词
 * @param  {[type]} clientId [description]
 * @param  {[type]} data      [description]
 * @return {[type]}           [description]
 */
Client.prototype.createFaqSynonyms = function(clientId, data) {
    return _resp(request.post(`${basePath}/${clientId}/faq/synonyms`, data));
};

/**
 * 获得近义词详情
 * @param  {[type]} clientId  [description]
 * @param  {[type]} synonymsId [description]
 * @return {[type]}            [description]
 */
Client.prototype.getFaqSynonymsDetail = function(clientId, synonymsId) {
    return _resp(
        request.get(`${basePath}/${clientId}/faq/synonyms/${synonymsId}`)
    );
};

/**
 * 更新近义词
 * @param  {[type]} clientId  [description]
 * @param  {[type]} synonymsId [description]
 * @param  {[type]} data       [description]
 * @return {[type]}            [description]
 */
Client.prototype.updateFaqSynonyms = function(clientId, synonymsId, data) {
    return _resp(
        request.put(`${basePath}/${clientId}/faq/synonyms/${synonymsId}`, data)
    );
};

/**
 * 删除近义词
 * @param  {[type]} clientId  [description]
 * @param  {[type]} synonymsId [description]
 * @return {[type]}            [description]
 */
Client.prototype.delFaqSynonyms = function(clientId, synonymsId) {
    return _resp(
        request.delete(`${basePath}/${clientId}/faq/synonyms/${synonymsId}`)
    );
};

Client.prototype.getFaqSynonymsList = function(clientId) {
    return _resp(request.get(`${basePath}/${clientId}/faq/synonyms`));
};

Client.prototype.queryFaq = function(clientId, clientSecret, data) {
    let path = `${basePath}/${clientId}/faq/query`;
    return _resp(
        request.post(path, data, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_POST, path),
            },
        })
    );
};

Client.prototype.parseIntent = function(clientId, data) {
    return _resp(request.post(`${basePath}/${clientId}/intent/parse`, data));
};

Client.prototype.getConversationList = function(clientId) {
    return _resp(request.get(`${basePath}/${clientId}/conversation`));
};

Client.prototype.getConversationDetail = function(clientId, conversationId) {
    return _resp(
        request.get(`${basePath}/${clientId}/conversation/${conversationId}`)
    );
};

Client.prototype.enableConversationById = function(clientId, conversationId) {
    return _resp(
        request.put(`${basePath}/${clientId}/conversation/${conversationId}/enable`)
    );
};

Client.prototype.disableConversationById = function(clientId, conversationId) {
    return _resp(
        request.put(
            `${basePath}/${clientId}/conversation/${conversationId}/disable`
        )
    );
};

Client.prototype.getConversationEnvironment = function(clientId) {
    return _resp(request.get(`${basePath}/${clientId}/conversation/environment`));
};

Client.prototype.putConversationEnvironment = function(clientId) {
    return _resp(
        request.put(`${basePath}/${clientId}/conversation/environment`, data)
    );
};

/**
 * 部署 botarchive
 * @param  {[type]} clientId     [description]
 * @param  {[type]} clientSecret [description]
 * @param  {[type]} data         [description]
 * @return {[type]}              [description]
 */
Client.prototype.deployConversationArchive = function(clientId, clientSecret, data) {
    let path = basePath + '/' + clientId + '/conversation/droplet/import';

    let authorization = null;

    if (clientSecret)
        authorization = generate(clientId, clientSecret, METHOD_POST, path);

    return superagent.post(baseURL + path)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', authorization)
        .accept('application/json')
        .attach('droplet', data.c66);
};

Client.prototype.queryConversation = function(clientId, clientSecret, data) {
    let path = `${basePath}/${clientId}/conversation/query`;
    return _resp(
        request.post(path, data, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_POST, path),
            },
        })
    );
};

Client.prototype.getUserList = function(
    clientId,
    clientSecret,
    page = 1,
    pageSize = 30,
    sortby = '-lasttime'
) {
    let path = `${basePath}/${clientId}/users?page=${page}&limit=${pageSize}&sortby=${sortby}`;
    debug('getUserList: %s, %s, %s', clientId, clientSecret, path);
    return _resp(
        request.get(path, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_GET, path),
            },
        })
    );
};

Client.prototype.getUserChatHistoryList = function(
    clientId,
    clientSecret,
    userId,
    page = 1,
    pageSize = 20
) {
    let path = `${basePath}/${clientId}/users/${userId}/chats?page=${page}&limit=${pageSize}`;
    debug('getUserChatHistoryList: %s, %s, %s', clientId, clientSecret, path);
    return _resp(
        request.get(path, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_GET, path),
            },
        })
    );
};

Client.prototype.muteUserById = function(clientId, clientSecret, userId) {
    let path = `${basePath}/${clientId}/users/${userId}/mute`;
    return _resp(
        request.post(path, null, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_POST, path),
            },
        })
    );
};

Client.prototype.unmuteUserById = function(clientId, clientSecret, userId) {
    let path = `${basePath}/${clientId}/users/${userId}/unmute`;
    return _resp(
        request.post(path, null, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_POST, path),
            },
        })
    );
};

Client.prototype.ismuteUserById = function(clientId, clientSecret, userId) {
    let path = `${basePath}/${clientId}/users/${userId}/ismute`;
    return _resp(
        request.post(path, null, {
            headers: {
                Authorization: generate(clientId, clientSecret, METHOD_POST, path),
            },
        })
    );
};

exports = module.exports = new Client();