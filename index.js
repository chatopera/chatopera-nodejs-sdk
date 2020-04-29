/**
 * Chatopera Node.js SDK
 */
const debug = require("debug")("chatopera:sdk:index");
const request = require("superagent");
const utils = require("./lib/utils");
const generate = require("./lib/generate-authorization");
const basePath = "/api/v1/chatbot";
const fs = require("fs");

// 处理JSON返回值
// TODO request.parse['application/json'] 有bug, 否则用它更好
function successHandler(res) {
  return new Promise((resolve, reject) => {
    let { rc, data, error, err, msg, message } = res.body;
    if (rc === 0) {
      // omit chatbotID
      if (data) {
        if (data.chatbotID) {
          delete data.chatbotID;
        } else if (Array.isArray(data)) {
          for (let x in data) {
            delete data[x].chatbotID;
          }
        }
      }
      resolve(data);
    } else {
      // check the possible error message
      reject(new Error(error || err || msg || message));
    }
  });
}

/**
 * 处理异常返回
 * @param {*} err
 */
function failHandler(err) {
  return Promise.reject(err);
}

/**
 * 聊天机器人
 */
class Chatbot {
  /**
   * 构造函数
   * @param {*} clientId
   * @param {*} clientSecret
   * @param {*} host
   */
  constructor(clientId, clientSecret, host = "https://bot.chatopera.com") {
    debug(
      "constructor: host %s, clientId %s, clientSecret %s",
      host,
      clientId,
      clientSecret
    );

    if (!!clientId) {
      this.clientId = clientId;
      this.clientSecret = clientSecret;
    } else {
      // null, false, blank or undefined.
      throw new Error("Chatbot: Unexpected clientId");
    }
    if (!!host) {
      if (host.endsWith("/")) host = host.substr(0, host.length - 1);
      this.host = host;
    } else {
      throw new Error("Chatbot: Unexpected host");
    }
  }

  /**
   * 获得详情
   */
  detail() {
    let endpoint = `${basePath}/${this.clientId}`;
    return request
      .get(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.GET,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  /**
   * 检索知识库
   */
  faq(userId, textMessage, faq_best_reply, faq_sugg_reply) {
    let endpoint = `${basePath}/${this.clientId}/faq/query`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .send({
        fromUserId: userId,
        query: textMessage,
        faq_sugg_reply: faq_sugg_reply,
        faq_best_reply: faq_best_reply,
      })
      .then(successHandler, failHandler);
  }

  /**
   * 查询多轮对话
   * @param {*} userId
   * @param {*} textMessage
   * @param {*} isDebug
   */
  conversation(
    userId,
    textMessage,
    faq_best_reply,
    faq_sugg_reply,
    isDebug = false
  ) {
    debug("conversation userId %s, textMessage %s", userId, textMessage);
    let endpoint = `${basePath}/${this.clientId}/conversation/query`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .send({
        fromUserId: userId,
        textMessage: textMessage,
        isDebug: isDebug,
        faq_best_reply: faq_best_reply,
        faq_sugg_reply: faq_sugg_reply,
      })
      .then(successHandler, failHandler);
  }

  /**
   * 查询用户列表
   * @param {*} limit
   * @param {*} page
   * @param {*} sortby
   */
  users(limit = 50, page = 1, sortby = "-lasttime") {
    let endpoint =
      basePath +
      "/" +
      this.clientId +
      `/users?page=${page}&limit=${limit}&sortby=${sortby}`;
    return request
      .get(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.GET,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  /**
   * 获得聊天历史记录
   * @param {*} userId
   * @param {*} limit
   * @param {*} page
   */
  chats(userId, limit = 50, page = 1) {
    let endpoint =
      basePath +
      "/" +
      this.clientId +
      `/users/${userId}/chats?page=${page}&limit=${limit}`;
    return request
      .get(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.GET,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  /**
   * 屏蔽一个聊天者
   * @param {*} userId
   */
  mute(userId) {
    let endpoint = `${basePath}/${this.clientId}/users/${userId}/mute`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  /**
   * 取消屏蔽一个聊天者
   * @param {*} userId
   */
  unmute(userId) {
    let endpoint = `${basePath}/${this.clientId}/users/${userId}/unmute`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  /**
   *
   * @param {*} userId
   */
  ismute(userId) {
    let endpoint = `${basePath}/${this.clientId}/users/${userId}/ismute`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  deployConversation(botarchive) {
    let exist = fs.existsSync(botarchive);
    if (!exist) {
      return reject(new Error("File not exist."));
    }

    let endpoint = `${basePath}/${this.clientId}/conversation/droplet/import`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "multipart/form-data")
      .set("Accept", "application/json")
      .attach("droplet", botarchive)
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  intentSession(uid, channel) {
    let endpoint = `${basePath}/${this.clientId}/clause/prover/session`;
    debug("intentSession: %s", this.host + endpoint);
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .send({ uid: uid, channel: channel })
      .then(successHandler, failHandler);
  }

  intentSessionDetail(sessionId) {
    let endpoint = `${basePath}/${this.clientId}/clause/prover/session/${sessionId}`;
    debug("intentSessionDetail: %s", this.host + endpoint);
    return request
      .get(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.GET,
          endpoint
        )
      )
      .then(successHandler, failHandler);
  }

  intentChat(sessionId, uid, textMessage) {
    let endpoint = `${basePath}/${this.clientId}/clause/prover/chat`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .send({
        fromUserId: uid,
        session: { id: sessionId },
        message: {
          textMessage,
        },
      })
      .then(successHandler, failHandler);
  }

  /**
   * Skills: 心理咨询聊天
   * @param {*} channel
   * @param {*} channelId
   * @param {*} userId
   * @param {*} textMessage
   */
  psychChat(channel, channelId, userId, textMessage) {
    let endpoint = `${basePath}/${this.clientId}/skills/psych/chat`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .send({
        channel: channel,
        channelId: channelId,
        userId: userId,
        textMessage: textMessage,
      })
      .then(successHandler, failHandler);
  }

  /**
   * Skills: 心理咨询查询
   * @param {*} query
   * @param {*} threshold
   */
  psychSearch(query, threshold) {
    let endpoint = `${basePath}/${this.clientId}/skills/psych/search`;
    return request
      .post(this.host + endpoint)
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Expires", "-1")
      .set(
        "Cache-Control",
        "no-cache,no-store,must-revalidate,max-age=-1,private"
      )
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set(
        "Authorization",
        generate(
          this.clientId,
          this.clientSecret,
          utils.HTTP_METHOD.POST,
          endpoint
        )
      )
      .send({
        query: query,
        threshold: threshold || 0.2,
      })
      .then(successHandler, failHandler);
  }
}

exports = module.exports = Chatbot;
