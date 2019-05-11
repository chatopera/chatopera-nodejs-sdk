/**
 * Chatopera Node.js SDK
 */
const debug = require("debug")("chatopera:sdk:index");
const utils = require("./src/utils");
const request = require("superagent");
const generate = require("./src/generate-authorization");
const basePath = "/api/v1/chatbot";
const fs = require("fs");

// 处理JSON返回值
// TODO request.parse['application/json'] 有bug, 否则用它更好
function extract(res) {
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
    return new Promise((resolve, reject) => {
      let endpoint = `${basePath}/${this.clientId}`;
      request
        .get(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   * 检索知识库
   */
  faq(userId, textMessage) {
    return new Promise((resolve, reject) => {
      let endpoint = `${basePath}/${this.clientId}/faq/query`;
      request
        .post(this.host + endpoint)
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
          query: textMessage
        })
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   * 查询多轮对话
   * @param {*} userId
   * @param {*} textMessage
   * @param {*} isDebug
   */
  conversation(userId, textMessage, isDebug = false) {
    return new Promise((resolve, reject) => {
      let endpoint = `${basePath}/${this.clientId}/conversation/query`;
      request
        .post(this.host + endpoint)
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
          isDebug: isDebug
        })
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   * 查询用户列表
   * @param {*} limit
   * @param {*} page
   * @param {*} sortby
   */
  users(limit = 50, page = 1, sortby = "-lasttime") {
    return new Promise((resolve, reject) => {
      let endpoint =
        basePath +
        "/" +
        this.clientId +
        `/users?page=${page}&limit=${limit}&sortby=${sortby}`;
      request
        .get(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   * 获得聊天历史记录
   * @param {*} userId
   * @param {*} limit
   * @param {*} page
   */
  chats(userId, limit = 50, page = 1) {
    return new Promise((resolve, reject) => {
      let endpoint =
        basePath +
        "/" +
        this.clientId +
        `/users/${userId}/chats?page=${page}&limit=${limit}`;
      request
        .get(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   * 屏蔽一个聊天者
   * @param {*} userId
   */
  mute(userId) {
    return new Promise((resolve, reject) => {
      let endpoint = `${basePath}/${this.clientId}/users/${userId}/mute`;
      request
        .post(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   * 取消屏蔽一个聊天者
   * @param {*} userId
   */
  unmute(userId) {
    return new Promise((resolve, reject) => {
      let endpoint = `${basePath}/${this.clientId}/users/${userId}/unmute`;
      request
        .post(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  /**
   *
   * @param {*} userId
   */
  ismute(userId) {
    return new Promise((resolve, reject) => {
      let endpoint = `${basePath}/${this.clientId}/users/${userId}/ismute`;
      request
        .post(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }

  deployConversation(botarchive) {
    return new Promise((resolve, reject) => {
      let exist = fs.existsSync(botarchive);
      if (!exist) {
        return reject(new Error("File not exist."));
      }

      let endpoint = `${basePath}/${this.clientId}/conversation/droplet/import`;
      request
        .post(this.host + endpoint)
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
        .then(res => {
          return extract(res);
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          debug("catch an error %o", err);
          return reject(err);
        });
    });
  }
}

exports = module.exports = Chatbot;
