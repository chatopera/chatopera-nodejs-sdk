/**
 * Chatopera Node.js SDK
 * Copyright 2020 Chatopera Inc. <https://www.chatopera.com>. All rights reserved.
 * This software and related documentation are provided under a license agreement containing
 * restrictions on use and disclosure and are protected by intellectual property laws.
 * Except as expressly permitted in your license agreement or allowed by law, you may not use,
 * copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform,
 * publish, or display any part, in any form, or by any means. Reverse engineering, disassembly,
 * or decompilation of this software, unless required by law for interoperability, is prohibited.
 */
const debug = require("debug")("chatopera:sdk:index");
const request = require("superagent");
const fs = require("fs");
const Q = require("@chatopera/q");
const generate = require("./lib/generate-authorization");
const { deprecate } = require("util");

// 常量
const BASE_PATH = "/api/v1/chatbot";
const K_CHATBOT_ID = "chatbotID";

const depCode = (fnName, day) => {
  return "chatopera/sdk <chatbot#" + fnName + "> " + day;
};

/**
 * 聊天机器人
 * 构造函数
 * @param {*} clientId
 * @param {*} clientSecret
 * @param {*} host
 */
function Chatbot(clientId, clientSecret, host = "https://bot.chatopera.com") {
  debug(
    "constructor: host %s, clientId %s, clientSecret %s",
    host,
    clientId,
    clientSecret
  );

  if (clientId) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseEndpoint = `${BASE_PATH}/${this.clientId}`;
  } else {
    // null, false, blank or undefined.
    throw new Error("Chatbot: Unexpected clientId");
  }

  if (host) {
    if (host.endsWith("/")) host = host.substr(0, host.length - 1);
    this.host = host;
  } else {
    throw new Error("Chatbot: Unexpected host");
  }
}

/**
 * 核心接口
 * @param {*} method
 * @param {*} path
 * @param {*} payload
 */
Chatbot.prototype.command = function (method, path, payload, headers, attach) {
  let deferred = Q.defer();
  let endpoint = this.baseEndpoint + path;

  // 处理参数
  method = method.toUpperCase();
  if (path) {
    let splits = path.split("&");
    if (splits.length > 1 && path.includes("?")) {
      path += "&sdklang=nodejs";
    } else {
      path += "?sdklang=nodejs";
    }
  } else {
    path = "/?sdklang=nodejs";
  }

  // 发送请求
  let req = request(method, this.host + endpoint)
    .set("X-Requested-With", "XMLHttpRequest")
    .set("Expires", "-1")
    .set(
      "Cache-Control",
      "no-cache,no-store,must-revalidate,max-age=-1,private"
    )
    .set(
      "Content-Type",
      headers && headers["Content-Type"]
        ? headers["Content-Type"]
        : "application/json"
    )
    .set(
      "Accept",
      headers && headers["Accept"] ? headers["Accept"] : "application/json"
    );

  if (this.clientSecret) {
    req.set(
      "Authorization",
      generate(this.clientId, this.clientSecret, method, endpoint)
    );
  }

  if (attach && attach instanceof Array) {
    for (let x of attach) {
      req.attach(x["filename"], x["filepart"]);
    }
  } else if (payload) {
    req.send(payload);
  }

  req.then(
    (res) => {
      if (res.body && res.body.rc === 0) {
        // omit chatbotID
        if (res.body.data) {
          if (res.body.data[K_CHATBOT_ID]) {
            delete res.body.data[K_CHATBOT_ID];
          } else if (res.body.data instanceof Array) {
            // fastest loop
            // https://www.incredible-web.com/blog/performance-of-for-loops-with-javascript/
            for (let i = res.body.data.length - 1; i >= 0; i--) {
              delete res.body.data[i][K_CHATBOT_ID];
            }
          }
        }
      }
      deferred.resolve(res.body);
    },
    (err) => {
      debug("[command] method %s, path %s, Error %s", method, path, err);
      deferred.reject({
        rc: 100,
        error: err,
      });
    }
  );

  return deferred.promise;
};

/**
 * 获得详情
 */
Chatbot.prototype.detail = function () {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("GET", "/");
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("detail", "2020-07-18")
  );
  return fn();
};

/**
 * 检索知识库
 */
Chatbot.prototype.faq = function (
  userId,
  textMessage,
  faq_best_reply,
  faq_sugg_reply
) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", "/faq/query", {
        fromUserId: userId,
        query: textMessage,
        faq_sugg_reply: faq_sugg_reply,
        faq_best_reply: faq_best_reply,
      });
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("faq", "2020-07-18")
  );
  return fn();
};

/**
 * 查询多轮对话
 * @param {*} userId
 * @param {*} textMessage
 * @param {*} isDebug
 */
Chatbot.prototype.conversation = function (
  userId,
  textMessage,
  faq_best_reply,
  faq_sugg_reply,
  isDebug = false
) {
  debug("conversation userId %s, textMessage %s", userId, textMessage);
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", "/conversation/query", {
        fromUserId: userId,
        textMessage: textMessage,
        isDebug: isDebug,
        faq_best_reply: faq_best_reply,
        faq_sugg_reply: faq_sugg_reply,
      });
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("conversation", "2020-07-18")
  );
  return fn();
};

/**
 * 查询用户列表
 * @param {*} limit
 * @param {*} page
 * @param {*} sortby
 */
Chatbot.prototype.users = function (
  limit = 50,
  page = 1,
  sortby = "-lasttime"
) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command(
        "GET",
        `/users?page=${page}&limit=${limit}&sortby=${sortby}`
      );
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("users", "2020-07-18")
  );
  return fn();
};

/**
 * 获得聊天历史记录
 * @param {*} userId
 * @param {*} limit
 * @param {*} page
 */
Chatbot.prototype.chats = function (userId, limit = 50, page = 1) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command(
        "GET",
        `/users/${userId}/chats?page=${page}&limit=${limit}`
      );
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("chats", "2020-07-18")
  );
  return fn();
};

/**
 * 屏蔽一个聊天者
 * @param {*} userId
 */
Chatbot.prototype.mute = function (userId) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", `/users/${userId}/mute`);
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("mute", "2020-07-18")
  );
  return fn();
};

/**
 * 取消屏蔽一个聊天者
 * @param {*} userId
 */
Chatbot.prototype.unmute = function (userId) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", `/users/${userId}/unmute`);
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("unmute", "2020-07-18")
  );
  return fn();
};

/**
 *
 * @param {*} userId
 */
Chatbot.prototype.ismute = function (userId) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", `/users/${userId}/ismute`);
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("ismute", "2020-07-18")
  );
  return fn();
};

Chatbot.prototype.deployConversation = function (botarchive) {
  let exist = fs.existsSync(botarchive);
  if (!exist) {
    throw new Error("File not exist.");
  }

  return this.command(
    "POST",
    "/conversation/droplet/import",
    null,
    {
      "Content-Type": "multipart/form-data",
    },
    [
      {
        filename: "droplet",
        filepart: botarchive,
      },
    ]
  );
};

Chatbot.prototype.intentSession = function (uid, channel) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", "/clause/prover/session", {
        uid: uid,
        channel: channel,
      });
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("intentSession", "2020-07-18")
  );
  return fn();
};

Chatbot.prototype.intentSessionDetail = function (sessionId) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("GET", `/clause/prover/session/${sessionId}`);
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("intentSessionDetail", "2020-07-18")
  );
  return fn();
};

Chatbot.prototype.intentChat = function (sessionId, uid, textMessage) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", "/clause/prover/chat", {
        fromUserId: uid,
        session: { id: sessionId },
        message: {
          textMessage,
        },
      });
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("intentChat", "2020-07-18")
  );
  return fn();
};

/**
 * Skills: 心理咨询聊天
 * @param {*} channel
 * @param {*} channelId
 * @param {*} userId
 * @param {*} textMessage
 */
Chatbot.prototype.psychChat = function (
  channel,
  channelId,
  userId,
  textMessage
) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", "/skills/psych/chat", {
        channel: channel,
        channelId: channelId,
        userId: userId,
        textMessage: textMessage,
      });
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("psychChat", "2020-07-18")
  );
  return fn();
};

/**
 * Skills: 心理咨询查询
 * @param {*} query
 * @param {*} threshold
 */
Chatbot.prototype.psychSearch = function (query, threshold) {
  let self = this;
  let fn = deprecate(
    () => {
      return self.command("POST", "/skills/psych/search", {
        query: query,
        threshold: threshold || 0.2,
      });
    },
    "use `Chatbot#command` API instead, removed in 2020-10",
    depCode("psychSearch", "2020-07-18")
  );
  return fn();
};

exports = module.exports = {
  Chatbot,
};
