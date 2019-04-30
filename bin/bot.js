#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const Chatopera = require('../index.js');
const tempDir = require('temp-dir');
const path = require('path');
const fs = require('fs');
const debug = require('debug')('chatopera:sdk:cli');
const utils = require('../src/utils.js');

/**
 * Connect to a bot and start chat.
 */
program
    .command('connect <clientId> <userName> [secret]')
    .action((clientId, userName, secret) => {
        if (clientId && userName) {
            let client = new Chatopera(clientId, secret);

            let prompt = () => {
                inquirer
                    .prompt({ name: 'send', message: 'Text' })
                    .then(function(answers) {
                        client
                            .conversation(userName, answers.send)
                            .then(res => {
                                console.log(res);
                                console.log('Bot:', res.string);
                            })
                            .catch(console.error)
                            .then(() => {
                                prompt();
                            });
                    });
            };

            prompt();
        } else {
            console.error('clientId and userName is required, secret is optional for Private Deployment.');
        }
    });

/**
 * Deploy bot archives for conversations
 */
program
    .command('deploy <clientId> <botarchive> [secret]')
    .action(async (clientId, botarchive, secret) => {

        // get index.json
        let isDirectory = fs.lstatSync(botarchive).isDirectory();
        if (!path.isAbsolute(botarchive)) {
            botarchive = path.join(process.cwd(), botarchive);
        }

        let pkg = require(botarchive + "/index.json");
        debug("name: %s", pkg.name);

        // compress botarchive to zip
        let ts = utils.getTimestamp();
        let tempc66 = path.join(tempDir, pkg.name + '.' + ts + '.c66');
        await utils.zipDirectory(botarchive, tempc66)
        debug("deploy: generate temp file %s", tempc66);
        let client = new Chatopera(clientId, secret);
        // submit file
        let result = await client.deployConversation(tempc66);
        debug("deploy: result %o", result);

        // remove temp file
        fs.unlink(tempc66, (err) => {
            if (err) {
                console.error(err)
                return
            }
            //file removed
        })
    });

program.version('1.3.1')
    .parse(process.argv);