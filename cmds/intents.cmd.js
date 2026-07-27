const debug = require('debug')('chatopera:sdk:cli:intents');
const { Option } = require('commander');
const fs = require('fs');
const moment = require('moment-timezone');
const logger = require('../lib/logger.js');
const intentsHandler = require("../handlers/intents.handler.js");

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
        await intentsHandler.intentsImport(payload);
      } else if (action == 'export') {
        await intentsHandler.intentsExport(payload);
      } else {
        // for train
        await intentsHandler.intentsTrain(payload);
      }
    });
};
