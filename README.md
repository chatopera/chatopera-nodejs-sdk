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

## 使用文档

[文档中心](https://docs.chatopera.com/products/chatbot-platform/integration.html)

## 命令行工具

Chatopera Node.js SDK 包括一些常用的命令，辅助开发者实现对话机器人。

CLI 使用方法：

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
cp sample.env .env # edit .env
npm run test
```

## license

Apache 2.0

Copyright 2018-2020, [北京华夏春松科技有限公司](https://www.chatopera.com/). All rights reserved. This software and related documentation are provided under a license agreement containing restrictions on use and disclosure and are protected by intellectual property laws. Except as expressly permitted in your license agreement or allowed by law, you may not use, copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform, publish, or display any part, in any form, or by any means. Reverse engineering, disassembly, or decompilation of this software, unless required by law for interoperability, is prohibited.

[![chatoper banner][co-banner-image]][co-url]

[co-banner-image]: https://user-images.githubusercontent.com/3538629/42383104-da925942-8168-11e8-8195-868d5fcec170.png
[co-url]: https://www.chatopera.com
