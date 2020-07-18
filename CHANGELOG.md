# 2.0.0

- 提供 `Chatbot#command` 接口，对 RestAPI 进一步封装，提高灵活性
- 将 `Chatbot` 作为成员类 `exports` 出来
- 增加 `DeprecationWarning`，以后统一使用 `Chatbot#command` 接口
- `queryString` 中增加 `sdklang=nodejs` 参数
- 调整接口的返回值为包含标准`rc`, `data`, `msg`, `error`, `status`的字段。

# 1.9.0

- 在 faq 及 conversation 检索接口中，增加 faq_best_reply 参数和 faq_sugg_reply 参数支持阀值过滤
