const debug = require("debug")("chatopera:sdk:admin");
const request = require("superagent");

const BASE_PATH = "/api/v1";

/**
 * 机器人管理
 */
class ChatoperaAdmin {
    constructor(accessToken, host = 'https://bot.chatopera.com') {
        if (!accessToken) {
            throw new Error("ChatoperaAdmin: Unexpected accessToken");
        }

        if (host) {
            if (host.endsWith("/")) host = host.substr(0, host.length - 1);
            this.host = host;
        } else {
            throw new Error("ChatoperaAdmin: Unexpected host");
        }

        this.accessToken = accessToken;
        this.host = host;
        this.baseEndpoint = BASE_PATH;

        debug(
            "constructor: host %s, accessToken %s",
            this.host,
            this.accessToken
        );
    }


    command(method, path, payload, headers) {
        //   debug("[command] method %s, path %s", method, path, payload);
        let endpoint = this.baseEndpoint + path;

        /**
         * 增加参数 sdklang
         */
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

        /**
         * 请求
         */
        let req = request(method, this.host + endpoint);

        req
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
            .set("Authorization", `Bearer ${this.accessToken}`)
            .set(
                "Accept",
                headers && headers["Accept"] ? headers["Accept"] : "application/json"
            );

        if (payload) {
            req.send(payload);
        }

        return req.then(
            (res) => {
                return res.body;
            },
            (err) => {
                debug("[command] method %s, path %s, Error %s", method, path, err);
                throw {
                    rc: 100,
                    error: err,
                };
            }
        );
    };
}

module.exports = exports = ChatoperaAdmin