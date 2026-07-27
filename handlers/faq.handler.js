const debug = require("debug")("chatopera:sdk:handler:faq");
const fs = require("fs");
const logger = require("../lib/logger.js");
const Bot = require("../index.js").Chatbot;
const _ = require("lodash");
const { sleep } = require("../lib/utils.js");

async function faqImport(payload) {
    logger.log(
        "Notice: import opersation maybe override data for the target bot, should better do an export operation before to backup the previous data."
    );
    debug("[faqImport] payload %j", payload);
    let DATA = null;

    try {
        // 绝对路径或当前文件的相对路径
        DATA = require(payload.filepath);
    } catch {
        // 相对于 cwd 的绝对路径
        DATA = require(require("path").join(process.cwd(), payload.filepath));
    }

    if (!DATA) {
        logger.error("Can not load data with " + payload.filepath);
        process.exit(1);
    }

    // 检查数据
    for (let i of DATA) {
        let { categories, post, replies, enabled, similarQuestions } = i;
        let pass = !!post;

        if (replies && replies.length > 0) {
            _.forEach(replies, (r) => {
                if (r.rtype == "hyperlink") {
                    if (!(r.title && r.url)) {
                        pass = false;
                    }
                } else {
                    if (!r.content) {
                        pass = false;
                    }
                }
            });
        } else {
            pass = false;
        }

        if (!pass) {
            logger.error("问题和答案必填");
            process.exit(1);
        }
    }

    // upload faq data
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    try {
        let index = 0;
        let count = DATA.length;
        for (let item of DATA) {
            try {
                let {
                    docId,
                    categories: categoryTexts,
                    post,
                    replies,
                    enabled,
                    similarQuestions,
                } = item;

                let exts = similarQuestions || [];

                _.forEach(replies, (r) => {
                    r.enabled = true;
                });

                const getFaq = async () =>
                    await client.command("GET", `/faq/database/${docId}`);

                const createFaq = async () =>
                    await client.command("POST", `/faq/database`, {
                        docId,
                        post,
                        replies,
                        categoryTexts,
                        enabled,
                    });

                const updateFaq = async (replyLastUpdate) =>
                    await client.command("PUT", `/faq/database/${docId}`, {
                        post,
                        replies,
                        categoryTexts,
                        enabled,
                        replyLastUpdate,
                    });

                let p = docId
                    ? getFaq().then((result) => {
                        if (result.rc !== 0) {
                            return createFaq();
                        } else {
                            return updateFaq(result.data.replyLastUpdate);
                        }
                    })
                    : createFaq();

                let { data, rc } = await p;

                const cleanExt = async (id) =>
                    await client
                        .command("GET", `/faq/database/${id}/extend`)
                        .then(async ({ data: { rc, data: extend } }) => {
                            if (extend) {
                                for (let e of extend) {
                                    await client.command(
                                        "delete",
                                        `/faq/database/${id}/extend/${e.id}`
                                    );
                                }
                            }
                        });

                if (rc == 0) {
                    await cleanExt(data.id);
                    for (let ext of exts) {
                        await client.command("POST", `/faq/database/${data.id}/extend`, {
                            post: ext,
                        });
                    }
                }

                index++;

                if (count > 300) {
                    if (index / 300 == 0) {
                        logger.info(`  Processed data %s/%s: %s...`, index, count, post);
                    }
                } else {
                    logger.info(`  Processed data %s/%s: %s ...`, index, count, post);
                }
            } catch (e) {
                logger.error(e);
                logger.error(`问题 ${item.post} Import fails`);
                process.exit(1);
            }
        }
        logger.log(`${payload.filepath} 上传成功`);
    } catch (e) {
        logger.error("Import fails", e);
        process.exit(1);
    }
}

async function faqExport(payload) {
    debug("[faqExport] payload %s", payload);
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let { data: categoriesMetadata } = await client.command(
        "GET",
        "/faq/categories"
    );
    let result = await client.command("GET", "/faq/database/export");

    if (result && result.rc == 0) {
        let data = _.map(result.data, (r) => {
            let [docId, categories, enabled, post, replies, ...exts] = r;

            if (!_.isArray(categories)) {
                categories = [];
            }

            let categoryTexts = [];
            for (let c of categories) {
                let select = _.find(categoriesMetadata, { value: c });
                if (select) {
                    categoryTexts.push(select.label);
                    categoriesMetadata = select.children;
                }
            }

            return {
                docId,
                categories: categoryTexts,
                enabled: enabled,
                post: post,
                replies: _.map(replies, (r) => {
                    delete r.enabled;
                    return r;
                }),
                similarQuestions: exts,
            };
        });

        fs.writeFileSync(payload.filepath, JSON.stringify(data, null, 2));
        logger.log(`${payload.filepath} file saved, data size ${data.length}`);
    } else {
        logger.error("faq export error", JSON.stringify(result));
    }
}

/**
 * 删除所有问答对数据
 * @param {*} payload 
 */
async function faqDropAll(payload) {
    debug("[faqDropAll] payload %s ...", payload);
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let { data: categoriesMetadata } = await client.command(
        "GET",
        "/faq/categories"
    );

    console.log("Fetching data ...");
    let result = await client.command("GET", "/faq/database/export");

    var counter = 0;

    console.log("Dropping data ...");
    if (result && result.rc == 0) {
        var total = result.data.length;
        console.log("Total records %d", total)
        _.map(result.data, async (r) => {
            let [docId, categories, enabled, post, replies, ...exts] = r;

            if (!_.isArray(categories)) {
                categories = [];
            }

            let categoryTexts = [];
            for (let c of categories) {
                let select = _.find(categoriesMetadata, { value: c });
                if (select) {
                    categoryTexts.push(select.label);
                    categoriesMetadata = select.children;
                }
            }

            await client.command("DELETE", `/faq/database/${docId}`);
            await sleep(1);
            if (counter++ % 200 == 0) {
                console.log("Dropping data records, done %d/%d ...", counter, total)
            }

            // return {
            //   docId,
            //   categories: categoryTexts,
            //   enabled: enabled,
            //   post: post,
            //   replies: _.map(replies, (r) => {
            //     delete r.enabled;
            //     return r;
            //   }),
            //   similarQuestions: exts,
            // };
        });
    } else {
        logger.error("faq dropall error", JSON.stringify(result));
    }
}

/**
 * 重新训练，re-index FAQ 知识库
 * @param {*} payload 
 */
async function faqTrain(payload) {
    console.log("Start to train FAQ ...");
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let result = await client.command("POST", `/faq/sync/customdicts`);

    if (result && result.rc == 0) {
        // train is started, wait for it done.
        console.log("FAQ Training is running. Wait for a moment, CLI will exit after the train job is done ...");
        let waitForDone = true;
        while (waitForDone) {
            await sleep(5);
            console.log("  Still wait ...");
            result = await client.command("GET", `/status`);
            if (result && result.rc == 0) {
                if (result.data && result.data.status) {
                    if (result.data.status.reindex == 0) {
                        console.log("知识库索引更新成功");
                        waitForDone = false;
                    } else if (result.data.status.reindex == 2) {
                        console.log("[WARN] 知识库或自定义词典变更，无法继续同步，可返回后重新提交。");
                        waitForDone = false;
                    } else if (result.data.status.reindex == 3) {
                        // other problem
                        console.log(result.data.status.reindexMsg);
                        waitForDone = false;
                        process.exit(3);
                    }
                } else {
                    waitForDone = false;
                    console.log("Error happens, unexpected data, no status data present, contact the service (https://dwz.chatopera.com/S72kR1).");
                    process.exit(1);
                }
            } else {
                waitForDone = false;
                console.log("Error happens, unexpected status for bot, contact the service (https://dwz.chatopera.com/S72kR1).");
                process.exit(2);
            }
        }
    } else {
        console.log(">> ERROR FAQ train is not started, contact the service (https://dwz.chatopera.com/S72kR1).");
        process.exit(3);
    }
}

module.exports = exports = {
    faqImport,
    faqExport,
    faqDropAll,
    faqTrain,
}