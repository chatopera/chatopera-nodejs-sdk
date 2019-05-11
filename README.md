<p align="center">
  <b>Chatopera开发者平台：809987971， <a href="https://jq.qq.com/?_wv=1027&k=5S51T2a" target="_blank">点击链接加入群聊</a></b><br>
  <img src="https://user-images.githubusercontent.com/3538629/48065864-d2da4080-e206-11e8-9f3b-a739719572dd.png" width="200">
</p>

# Chatopera

---

[Chatopera](https://www.chatopera.com/)提供聊天机器人开发者平台，Chatopera SDK 用于在 Node.js 应用中集成[聊天机器人服务](https://bot.chatopera.com/)。

## 安装

---

```
npm install @chatopera/sdk --save
```

## SDK 使用方法

```
var Chatbot = require("@chatopera/sdk");

var chatbot = new Chatbot(*ClientId*, *Secret* [, ServiceProvider]);

```

> 提示: 对于私有部署，使用 ServiceProvider 定义服务地址

### 获取 ClientId 和 Secret

请[点击这里](https://bot.chatopera.com/)。

- 创建聊天机器人

登录 Chatopera 控制台后，创建聊天机器人。

<img src="https://user-images.githubusercontent.com/3538629/47634129-476c0a00-db8b-11e8-8564-b65d19610ced.png" width="600"/>

- 获得认证信息

在【设置】页面，获得 ClientId 和 Secret。

<img src="https://user-images.githubusercontent.com/3538629/47634141-52bf3580-db8b-11e8-9ad2-c7e702ef9d42.png" width="600" />

## 快速开始

通过[示例程序](https://github.com/chatopera/chatopera-sample-node)快速开始使用 SDK。

## API 接口

> 请先完成注册 [Chatopera](https://bot.chatopera.com/)并创建一个聊天机器人。

说明：

```
1. 除创建机器人实例外，接口调用都是基于 async/await 方式。
2. 在非正常返回情况下，接口会抛出异常 Error(msg)。
3. 下面各接口的返回值，按正常情况下介绍。
```

### 获得聊天机器人实例

```
var Chatbot = require("@chatopera/sdk");
var chatbot = new Chatbot(*ClientId*, *Secret*);

```

### 获得聊天机器人详情

```
var detail = await chatbot.detail();
```

返回值

```
{
  "name": "bar",
  "fallback": "我不明白您的意思。",
  "description": "",
  "welcome": "你好！我是机器人客服。",
  "primaryLanguage": "zh_CN"
}
```

### 进行多轮对话

```
var reply = await chatbot.conversation("张三", "今天北京天气怎么样");
```

返回值

```
{
  "state": "default",
  "createdAt": 1540796868205,
  "string": "白天天气晴好，早晚会感觉偏凉，午后舒适、宜人。",
  "topicName": "weather",
  "subReplies": [],
  "service": {
    "provider": "conversation"
  },
  "logic_is_fallback": false,
  "botName": "bar"
}
```

说明：多轮对话的返回值的含义参考[文档中心](https://docs.chatopera.com/chatbot-engine.html)。

### 进行 FAQ 对话

```
var reply = await chatbot.faq("张三", "停效期间的保单是否能办理减保");
```

返回值

```
[
  {
    "id": "AWa-Ogcaf3EIFA_CgZ3o",
    "score": 0.747,
    "post": " 停效期间的保单是否能办理减保？",
    "reply": " 停效期间的保单可以办理减保"
  },
  ...
]
```

说明：返回值为数组，*id*代表问答对 ID，*score*是相似度分数，*reply*是回复。在含有多个元素时按*score*降序排列，*score*的分数在[0,1]之间，越接近 1 越相似。

### 查看用户列表

```
let users = await chatbot.users();
```

返回值

```
[
  {
    "userId": "张三",
    "lasttime": "2018-10-29T07:07:47.812Z",
    "created": "2018-10-29T05:02:13.084Z"
  },
  ...
]
```

说明: 按最后对话时间将序排列。

### 查看用户聊天历史

```
let chats = await chatbot.chats("张三");
```

返回值

```
[
  {
    "userId": "张三",
    "created": "2018-10-29T05:29:41.833Z",
    "textMessage": "白天天气晴好，早晚会感觉偏凉，午后舒适、宜人。",
    "direction": "outbound",
    "service": "conversation",
    "confidence": 1
  }
]
```

说明：按照每条消息的生成时间升序排列。

### 屏蔽用户

以该用户 ID 发送给聊天机器人信息时，将不能得到回复，此时回复内容[参考文档](https://docs.chatopera.com/chatbot-engine.html)。

```
await chatbot.mute("张三");
```

返回值为空

### 取消屏蔽

将一个用户取消屏蔽。

```
await chatbot.ummute("张三");
```

返回值为空

### 查看用户是否被屏蔽

查看一个用户是否被这个机器人屏蔽了。

```
let result = await chatbot.ismute("张三");
```

返回值为 Boolean

```
[true|false]
```

关于各接口返回值的更多描述参考[开发者平台文档](https://docs.chatopera.com/chatbot-platform.html)。

## CLI 使用方法

Chatopera Node.js SDK 包括一些常用的命令，辅助开发者实现对话机器人。

### connect

在命令行终端连接 Bot 并进行对话。

```
Usage: connect [options]

Options:
  -c, --clientid <value>      ClientId of the bot, *required.
  -u, --username <value>      Username to chat with bot, *required.
  -s, --clientsecret [value]  Client Secret of the bot, optional, default null
  -p, --provider [value]      Chatopera Superbrain Instance URL, optional, default https://bot.chatopera.com
  -h, --help                  output usage information
```

其中，`Client ID`和`Client Secret`来自于平台，在独立使用智能问答引擎时，可以省略`Client Secret`。`username`代表用户名，是一个不含空格或特殊符号的字符串，每个用户的唯一标识，`provider`是智能问答引擎地址，默认为 [Chatopera 机器人平台](https://bot.chatopera.com/)。

示例：

```
bot connect -c 5cd29bf7xxx -s 0d8e43cc4de22e9e2cb89f69xxx -u zhangsan
```

### deploy

在命令行终端发布 botarchive 文件到多轮对话中。

```
Usage: deploy [options]

Options:
  -c, --clientid <value>      ClientId of the bot, *required.
  -b, --botarchive <value>    Conversation Bundle, *required.
  -s, --clientsecret [value]  Client Secret of the bot, optional, default null.
  -p, --provider [value]      Chatopera Superbrain Instance URL, optional, default https://bot.chatopera.com
  -h, --help                  output usage information
```

其中`botarchive`为机器人的文件目录和`xx.c66`文件，支持*相对路径*或*绝对路径*。

标准目录结构:

```
botarchive
├── index.json
├── plugin.js
└── zh_CN.greeting.ms
```

其中，`index.json`描述机器人多轮对话属性：

```
{
    "name": "大白",
    "primaryLanguage": "zh_CN",
    "version": "0.5.0",
    "conversations": [
        {
            "name": "greeting",
            "enabled": true
        }
    ],
    "config": // 环境变量Key-Value
    {
    }
}
```

`plugin.js`是`函数`，参考[说明文档](https://docs.chatopera.com/conversation-designer.html)。

### 获得帮助

```
bot --help
```

## Contribute

打印调试日志

```
export DEBUG=chatopera*
```

## license

Apache 2.0

Copyright 2017-2018, [北京华夏春松科技有限公司](https://www.chatopera.com/). All rights reserved. This software and related documentation are provided under a license agreement containing restrictions on use and disclosure and are protected by intellectual property laws. Except as expressly permitted in your license agreement or allowed by law, you may not use, copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform, publish, or display any part, in any form, or by any means. Reverse engineering, disassembly, or decompilation of this software, unless required by law for interoperability, is prohibited.

[![chatoper banner][co-banner-image]][co-url]

[co-banner-image]: https://user-images.githubusercontent.com/3538629/42383104-da925942-8168-11e8-8195-868d5fcec170.png
[co-url]: https://www.chatopera.com
