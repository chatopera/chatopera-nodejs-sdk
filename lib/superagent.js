/**
 * Mock superagent APIs with fetch built-in.
 * This mimic is not intend to replace the whole superagent api,
 * just the interfaces used in Chatopera, Chatbot.
 */

const debug = require("debug")("chatopera:sdk:superagent");
const _ = require("lodash");
const fs = require("fs");
const { ChatoperaSDKGeneralError } = require("../lib/exceptions");

class Superagent {

    constructor(method, url) {
        this.method = method;
        this.url = url;
        this.headers = {};
        this.attachments = {};
        this.fields = {};
        this.data = null;
        this.isSend = false;
    }

    set(key, value) {
        this.headers[key] = value;
        return this;
    }

    attach(field, filepath) {
        this.attachments[field] = filepath;
        return this;
    }

    field(field, value) {
        this.fields[field] = value;
        return this;
    }

    /**
     * NOTE:
     * send behaves differently with superagent.
     * request really happens with then called.
     * @param {*} payload 
     * @returns 
     */
    send(payload) {
        if (this.isSend) {
            throw new ChatoperaSDKGeneralError("Request is already send");
        } else {
            this.isSend = true;
        }

        this.data = payload;
        return this;
    }

    /**
     * DO NOT CALL THIS DIRECTLY, ONLY WITH .then() INSTEAD.
     * Promise with this Object
     * https://stackoverflow.com/a/65662401/968704
     */
    async executor() {

        let body = (this.data && _.isObjectLike(this.data)) ? JSON.stringify(this.data) : this.data;

        if (this.headers["Content-Type"] === "multipart/form-data") {
            let dataAppended = false;
            body = new FormData();
            for (let x of _.keys(this.attachments)) {
                try {
                    let f = fs.readFileSync(this.attachments[x]);
                    let blob = new Blob([f], { type: "application/zip" });
                    body.append(x, blob);
                    dataAppended = true;
                } catch (e) {
                    console.error("send multipart/form-data error");
                    console.error(e);
                }
            }

            if (!dataAppended) {
                throw new ChatoperaSDKGeneralError("Fail to append data to submit request of `multipart/form-data`");
            }

            // https://stackoverflow.com/questions/49692745/express-using-multer-error-multipart-boundary-not-found-request-sent-by-pos
            // Now remove headers or "Content-Type": "multipart/form-data", so that Fetch api automatically set the headers. 
            delete this.headers["Content-Type"];
        }

        console.log("send body", body);
        let resp = await fetch(this.url, {
            method: this.method,
            headers: this.headers,
            body: body
        });

        // https://developer.mozilla.org/en-US/docs/Web/API/Response
        // console.log("resp status", resp.status);

        if (resp.status !== 200) {
            console.log("[chatopera/sdk] Invalid response")
            console.error(resp);
            throw new ChatoperaSDKGeneralError("Invalid response status " + resp.status);
        }

        let result = resp.json();
        return {
            body: result
        };
    }

    /**
     * Where request is really send.
     * @returns 
     */
    then() {
        const promise = this.executor();
        return promise.then.apply(promise, arguments);
    }

    catch() {
        const promise = this.executor();
        return promise.catch.apply(promise, arguments);
    }
}

function request(method, url) {
    return new Superagent(method, url);
}


module.exports = exports = request;