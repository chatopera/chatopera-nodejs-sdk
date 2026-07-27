const debug = require("debug")("chatopera:sdk:handler:intents");
const fs = require("fs");
const logger = require("../lib/logger.js");
const Bot = require("../index.js").Chatbot;
const _ = require("lodash");
const { sleep } = require('../lib/utils.js');

async function intentsTrain(payload) {
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    // 执行训练
    logger.log('Start to train model for dev branch ...');

    let result = await client.command('POST', '/clause/devver/train');

    if (result && result.rc == 0) {
        let loop = true;
        while (loop) {
            // 等待状态
            await sleep();

            // 检查状态
            let result2 = await client.command('GET', '/clause/devver/build');

            if (result2 && result2.rc == 0) {
                logger.log('Train works done successfully.');
                loop = false;
            } else if (result2 && result2.rc == 2) {
                logger.log('Train in progress ...');
            } else {
                // errors
                logger.error('Error happens during training', result2);
                process.exit(1);
            }
        }
    } else {
        console.log(result);
        logger.error('Fails to train model for dev branch', result.error);
        process.exit(1);
    }
}

async function intentsImport(payload) {
    logger.log(
        'Notice: import opersation maybe override data for the target bot, should better do an export operation before to backup the previous data.'
    );
    debug('[intentsImport] payload %j', payload);
    let DATA = null;

    try {
        // 绝对路径或当前文件的相对路径
        DATA = require(payload.filepath);
    } catch {
        // 相对于 cwd 的绝对路径
        DATA = require(require('path').join(process.cwd(), payload.filepath));
    }

    if (!DATA) {
        logger.error('Can not load data with ' + payload.filepath);
        process.exit(1);
    }

    // upload intent data
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    try {
        if (DATA.length > 0) {
            for (const intent of DATA) {
                if (!/^[0-9a-zA-Z_]+$/.test(intent.name)) {
                    logger.error(`Invalid intent name ${intent.name}`);
                    return;
                }

                if (_.isArray(intent.slots)) {
                    for (let slot of intent.slots) {
                        if (
                            !(
                                /^[0-9a-zA-Z_]+$/.test(slot.name) &&
                                slot.dict &&
                                slot.dict.name
                            )
                        ) {
                            logger.error(`Invalid slot name ${slot.name} of dict`);
                            return;
                        }
                    }
                }
            }

            let result = await client.command('POST', `/clause/intents/import`, {
                intents: DATA,
            });

            if (result.rc != 0) {
                logger.error(`Import  fails`, result.error);
                return;
            }

            await intentsTrain(payload);
        } else {
            logger.log(`No intent records in ${payload.filepath} ...`);
        }
    } catch (e) {
        logger.error('Import fails', e);
        process.exit(1);
    }
}

async function intentsExport(payload) {
    debug('[intentsExport] payload %s', payload);
    let client = null;
    if (payload.provider) {
        client = new Bot(payload.clientid, payload.clientsecret, payload.provider);
    } else {
        client = new Bot(payload.clientid, payload.clientsecret);
    }

    let result = await client.command('GET', '/clause/intents?limit=9999&page=1');

    if (result && result.rc == 0) {
        let data = [];

        let intents = result.data;

        for (let x of intents) {
            let intent = {
                name: x.name,
                description: x.description,
                createdate: x.createdate,
                updatedate: x.updatedate,
                utters: [],
                slots: [],
            };
            // 获得意图说法
            let result2 = await client.command(
                'GET',
                `/clause/utters?limit=9999&page=1&intentName=${x.name}`
            );
            if (result2 && result2.rc == 0) {
                for (let y of result2.data) delete y['id'];
                intent['utters'] = result2.data;
            }

            // 获得意图槽位
            let result3 = await client.command(
                'GET',
                `/clause/slots?limit=9999&page=1&intentName=${x.name}`
            );
            if (result3 && result3.rc == 0) {
                for (let y of result3.data) delete y['id'];
                intent['slots'] = result3.data;
            }

            data.push(intent);
        }

        fs.writeFileSync(payload.filepath, JSON.stringify(data, null, 2));
        logger.log(`${payload.filepath} file saved, intents size ${data.length}`);
    } else {
        logger.error('intents export error', JSON.stringify(result));
    }
}


module.exports = exports = {
    intentsTrain,
    intentsImport,
    intentsExport,
}