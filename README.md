<p align="center">
  <b>Chatopera开发者平台：809987971， <a href="https://jq.qq.com/?_wv=1027&k=5S51T2a" target="_blank">点击链接加入群聊</a></b><br>
  <img src="https://user-images.githubusercontent.com/3538629/48065864-d2da4080-e206-11e8-9f3b-a739719572dd.png" width="200">
</p>

# Chatopera Node.js SDK

---

[Chatopera](https://www.chatopera.com/)提供聊天机器人开发者平台，Chatopera SDK 用于在 Node.js 应用中集成[聊天机器人服务](https://bot.chatopera.com/)。

聊天机器人即服务，自动化、智能化的自然语言交互！

## 安装

---

```
npm install @chatopera/sdk --save
```

## 使用文档

快速开始，类接口定义和实例化文档等，参考 [文档中心](https://docs.chatopera.com/products/chatbot-platform/integration.html)：

[https://docs.chatopera.com/products/chatbot-platform/integration.html](https://docs.chatopera.com/products/chatbot-platform/integration.html)

## 命令行工具

Chatopera Node.js SDK 包括一些常用的命令，辅助开发者实现对话机器人。

### 获得帮助

打印可用命令。

```
bot --help
```

### 配置

**优先级:** 命令行参数 > `.env`文件 > 环境变量

| 映射配置项                         | 命令行参数               | 环境变量            | 备注                              |
| ---------------------------------- | ------------------------ | ------------------- | --------------------------------- |
| clientId, 机器人 ID                | `-c, --clientid [value]` | `BOT_CLIENT_ID`     | 无默认值，必填                    |
| secret, 机器人密钥                 | `-u, --username [value]` | `BOT_CLIENT_SECRET` | 无默认值，必填                    |
| provider, Chatopera 机器人平台地址 | `-p, --provider [value]` | `BOT_PROVIDER`      | 默认值，https://bot.chatopera.com |

其中， `.env` 文件例子如：

```
BOT_CLIENT_ID=xxx
BOT_CLIENT_SECRET=xxx
BOT_PROVIDER=https://bot.chatopera.com
```

`.env` 文件存储的也是环境变量值。`bot` 命令会沿当前执行命令的路径(`pwd`)，寻找 `.env` 文件。

比如，在 `/Users/chatopera/chatopera-nodejs-sdk`下执行 `bot` 命令，那么，`.env`文件按照以下顺序进行查找，一旦查找到就加载为配置，并退出查找。

```
/Users/chatopera/chatopera-nodejs-sdk/.env
/Users/chatopera/.env
/Users/.env
/.env
```

### 连接聊天机器人

在命令行终端连接 Bot 并进行对话。

```
Usage: connect [options]

Options:
  -c, --clientid [value]      ClientId of the bot
  -s, --clientsecret [value]  Client Secret of the bot, optional, default null
  -u, --username [value]      Username to chat with bot, default: commandline
  -p, --provider [value]      Chatopera Bot Service URL, optional, default https://bot.chatopera.com
  -fb, --faq-best [value]     FAQ best reply threshold, optional, default 0.8
  -fs, --faq-sugg [value]     FAQ suggest reply threshold, optional, default 0.6
```

其中，`clientid`和`clientsecret`从每个机器人的设置页面获取，`username`代表用户名，是一个不含空格或特殊符号的字符串，每个用户的唯一标识，`provider`是[Chatopera 机器人平台](https://docs.chatopera.com/products/chatbot-platform/index.html)地址，默认为 [Chatopera 云服务](https://bot.chatopera.com/)。

示例：

```
bot connect -c xxx -s xxx -u zhangsan
```

在对话中，可以使用快捷方式，快速输入。

| 快捷方式                                 | Mac OSX / Windows                              |
| ---------------------------------------- | ---------------------------------------------- |
| 回溯历史                                 | ↑ 上箭头；↓ 下箭头                             |
| 打印历史                                 | Shift + → 右箭头                               |
| 使用索引输入历史，索引根据*打印历史*获得 | 输入索引，然后 Ctrl + Shift + Shift + → 右箭头 |

### 上传多轮对话脚本

在命令行终端发布脚本文件到[多轮对话](https://docs.chatopera.com/products/chatbot-platform/conversation.html)中。

```
Usage: deploy [options]

Options:
  -c, --clientid [value]      ClientId of the bot
  -s, --clientsecret [value]  Client Secret of the bot, optional, default null.
  -p, --provider [value]      Chatopera Bot Service URL, optional, default https://bot.chatopera.com
  -b, --botarchive <value>    Conversation Bundle, *required.
  -h, --help                  display help for command
```

其中 `botarchive` 为**机器人的话题文件目录**或 `xx.c66` 文件，支持*相对路径*或*绝对路径*。

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

`plugin.js`是`函数`，参考[说明文档](https://docs.chatopera.com/products/chatbot-platform/conversation.html#%E5%A4%9A%E8%BD%AE%E5%AF%B9%E8%AF%9D%E8%AE%BE%E8%AE%A1%E5%99%A8)。

快速开始参考[示例程序](https://github.com/chatopera/chatbot-samples)：[活动通知](https://github.com/chatopera/chatbot-samples/tree/master/projects/%E6%B4%BB%E5%8A%A8%E9%80%9A%E7%9F%A5)。

### 打印聊天机器人日志

方便调试多轮对话脚本，实时跟踪服务器端日志，排查问题。

```
Usage: bot trace [options]

Options:
  -c, --clientid [value]      ClientId of the bot
  -s, --clientsecret [value]  Client Secret of the bot, optional, default null
  -p, --provider [value]      Chatopera Bot Service URL, optional, default https://bot.chatopera.com
  -l, --log-level [value]     Log level to follow, optional, [DEBUG|INFO|WARN|ERROR], default DEBUG
  -h, --help                  display help for command
```

### 语音识别

```
Usage: bot asr [options]

Options:
  -c, --clientid [value]      ClientId of the bot
  -u, --username [value]      Username to chat with bot
  -s, --clientsecret [value]  Client Secret of the bot, optional, default null
  -p, --provider [value]      Chatopera Bot Service URL, optional, default https://bot.chatopera.com
  -f, --file <value>          Target file to recognize, *required.
  -h, --help                  display help for command
```

示例：

```
bot asr -c xxx \
     -s xxxx \
     -u nodetest \
     -f ./test/fixtures/001.wav
{
 "rc": 0,
 "data": {
  "duration": 6250,
  "predicts": [
   {
    "confidence": 0.960783,
    "text": "上海 浦东机场 入境 房 输入 全 闭 环 管理"
   },
   {
    "confidence": 0.960767,
    "text": "上海 浦东机场 入境 防 输入 全 闭 环 管理"
   },
   {
    "confidence": 0.960736,
    "text": "上海 浦东机场 入境 坊 输入 全 闭 环 管理"
   }
  ]
 }
}
```

## Contribute

打印调试日志

```
export DEBUG=chatopera*
cp sample.env .env # edit .env
npm run test
```

## license

Apache 2.0

Copyright 2018-2020, [北京华夏春松科技有限公司](https://www.chatopera.com/). All rights reserved. This software and related documentation are provided under a license agreement containing restrictions on use and disclosure and are protected by intellectual property laws. Except as expressly permitted in your license agreement or allowed by law, you may not use, copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform, publish, or display any part, in any form, or by any means. Reverse engineering, disassembly, or decompilation of this software, unless required by law for interoperability, is prohibited.

[![chatoper banner][co-banner-image]][co-url]

[co-banner-image]: https://user-images.githubusercontent.com/3538629/42383104-da925942-8168-11e8-8195-868d5fcec170.png
[co-url]: https://www.chatopera.com
