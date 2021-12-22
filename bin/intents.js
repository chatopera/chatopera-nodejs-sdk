const inquirer = require('inquirer');
const debug = require('debug')('chatopera:sdk:cli');
const { Option } = require('commander');
const Bot = require('../index.js').Chatbot;
const fs = require('fs');
const moment = require('moment-timezone');
const logger = require('../lib/logger');
const _ = require('lodash');
const { sleep } = require('../lib/utils');

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
    for (let intent of DATA) {
      try {
        // 首先尝试删除意图
        let result = await client.command(
          'DELETE',
          `/clause/intents/${intent.name}`
        );
      } catch (e) {}

      // 创建意图
      let result = await client.command('POST', `/clause/intents`, {
        name: intent.name,
      });

      if (result && result.rc == 0) {
        // 添加意图描述
        if (intent['description']) {
          await client.command('PUT', `/clause/intents/${intent.name}`, {
            description: intent.description,
          });
        }

        // 添加意图槽位
        if (intent['slots']) {
          for (let slot of intent['slots']) {
            let body = {
              intent: {
                name: intent.name,
              },
              slot: {
                name: slot.name,
                requires: slot.requires,
                question: slot.question,
              },
            };

            if (slot.dict.builtin) {
              body['sysdict'] = {
                name: slot.dict.name,
              };
            } else {
              body['customdict'] = {
                name: slot.dict.name,
              };
            }

            let result2 = await client.command('POST', `/clause/slots`, body);
          }
        }

        // 添加意图说法
        if (intent['utters']) {
          for (let utter of intent['utters']) {
            try {
              let result3 = await client.command('POST', '/clause/utters', {
                intent: {
                  name: intent.name,
                },
                utter: {
                  utterance: utter['utterance'],
                },
              });
            } catch (e) {
              logger.error(`Import utterance ${utter['utterance']} error`);
            }
          }
        }
      }
    }

    if (DATA.length > 0) {
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

exports = module.exports = (program) => {
  /**
   * Connect to a bot and start chat.
   */
  program
    .command('intents')
    .description("train, import or export a bot's intents data")
    .option('-c, --clientid [value]', 'ClientId of the bot')
    .option(
      '-s, --clientsecret [value]',
      'Client Secret of the bot, optional, default null'
    )
    .option(
      '-p, --provider [value]',
      'Chatopera Bot Service URL, optional, default https://bot.chatopera.com'
    )
    .addOption(
      new Option('-a, --action <value>', 'Operation action').choices([
        'import',
        'export',
        'train',
      ])
    )
    .option(
      '-f, --filepath [value]',
      'Export json data to file path or import json data with file path'
    )
    .action(async (cmd) => {
      require('../lib/loadenv.js'); // load environment variables
      debug('connect cmd %o', cmd);

      let { provider, clientid, clientsecret, action, filepath } = cmd;

      if (typeof clientid === 'boolean' || !clientid) {
        clientid = process.env['BOT_CLIENT_ID'];
        if (!clientid) {
          logger.error(
            '[Error] Invalid clientid, set it with cli param `-c BOT_CLIENT_ID` or .env file'
          );
          process.exit(1);
        }
      }

      if (typeof clientsecret === 'boolean' || !clientsecret) {
        clientsecret = process.env['BOT_CLIENT_SECRET'];
        if (!clientsecret) {
          logger.log('[WARN] client secret is not configured.');
        }
      }

      if (typeof provider === 'boolean' || !provider) {
        provider = process.env['BOT_PROVIDER'];
      }

      if (action == undefined) {
        logger.error(
          "error: option '-a, --action <value>' argument is invalid. Allowed choices are import, export."
        );
        process.exit(1);
      } else if (action == 'import') {
        if (!filepath) {
          logger.error(
            `-f or --filepath FILE_PATH is required in command line for importing faq.`
          );
          process.exit(1);
        }

        if (!fs.existsSync(filepath)) {
          logger.error(`${filepath} not found.`);
          process.exit(1);
        } else if (!filepath.endsWith('.json')) {
          logger.error(
            `${filepath} is not end with .json, it has to be in JSON format and ends with .json`
          );
          process.exit(1);
        }
      } else if (action == 'export') {
        // for export
        if (typeof filepath === 'boolean' || !filepath) {
          // generate a file
          filepath = require('path').join(
            process.cwd(),
            `bot.intents.${moment()
              .tz(process.env.TZ)
              .format('YYYY_MM_DD_HHmmss')}.json`
          );
        }

        if (fs.existsSync(filepath)) {
          logger.error(`${filepath} file exist`);
          process.exit(1);
        }
      } else {
        // train
      }

      if (!!provider) {
        logger.log(
          '>> connect to %s, clientId %s, secret *** ...',
          provider,
          clientid
        );
      } else {
        logger.log(
          '>> connect to https://bot.chatopera.com, clientId %s, secret *** ...',
          clientid
        );
      }

      let payload = {
        provider,
        clientid,
        clientsecret,
        action,
        filepath,
        format: 'json', // currently, for import and export, only in json format.
      };

      if (action == 'import') {
        await intentsImport(payload);
      } else if (action == 'export') {
        await intentsExport(payload);
      } else {
        // for train
        await intentsTrain(payload);
      }
    });
};
