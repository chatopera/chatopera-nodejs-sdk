# Chatopera Node.js SDK

---

低代码或无代码方式定制智能对话机器人！

[Chatopera](https://www.chatopera.com/) 提供聊天机器人开发者平台，Chatopera SDK 用于在 Node.js 应用中集成[聊天机器人服务](https://bot.chatopera.com/)。

## 安装

---

```
npm install @chatopera/sdk --save
```

## 接口使用文档

快速开始，类接口定义和实例化文档等，参考 [文档中心](https://docs.chatopera.com/products/chatbot-platform/integration/index.html#sdk)：

[https://docs.chatopera.com/products/chatbot-platform/integration/index.html#sdk](https://docs.chatopera.com/products/chatbot-platform/integration/index.html#sdk)

Chatopera CLI 是连接 Chatopera 机器人平台，管理和维护资源的工具，包括一些常用的命令，辅助开发者实现和管理对话机器人。尤其是在有自动化或批量管理的需要时。CLI 完全基于 [Chatopera Node.js SDK](Chatopera Node.js SDK)，开发者也可以参考 SDK 源码，进一步掌握对 SDK 的使用。

[https://github.com/chatopera/chatopera-nodejs-sdk](https://github.com/chatopera/chatopera-nodejs-sdk)

## 命令行界面 CLI 使用文档

使用如下形式安装：

```
npm install -g @chatopera/sdk
```

会将 `@chatopera/sdk` 中的 `bot` 命令注册到系统 `PATH` 中，`bot` 是 Chatopera 命令行界面工具，简称 Chatopera CLI。

使用 Chatopera CLI 可以提升自动化管理 Chatopera 资源、维护和调试的便利性，详细说明文档参考：

[https://docs.chatopera.com/products/chatbot-platform/integration/cli.html](https://docs.chatopera.com/products/chatbot-platform/integration/cli.html)

## Support

技术支持：
[https://docs.chatopera.com/products/chatbot-platform/contract/support.html](https://docs.chatopera.com/products/chatbot-platform/contract/support.html)

## Contribute

打印调试日志

```
export DEBUG=chatopera*
cp sample.env .env # edit .env
npm run test
```

## License

Apache 2.0

Copyright 2018-2021, [北京华夏春松科技有限公司](https://www.chatopera.com/). All rights reserved. This software and related documentation are provided under a license agreement containing restrictions on use and disclosure and are protected by intellectual property laws. Except as expressly permitted in your license agreement or allowed by law, you may not use, copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform, publish, or display any part, in any form, or by any means. Reverse engineering, disassembly, or decompilation of this software, unless required by law for interoperability, is prohibited.

[![chatoper banner][co-banner-image]][co-url]

[co-banner-image]: https://user-images.githubusercontent.com/3538629/42383104-da925942-8168-11e8-8195-868d5fcec170.png
[co-url]: https://www.chatopera.com
