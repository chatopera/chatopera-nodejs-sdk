require('dotenv').config();
const test = require('ava');
const debug = require('debug')('chatopera:sdk:test');
const { Chatopera } = require('../index');
const accessToken = process.env['BOT_ACCESS_TOKEN'];
const botProvider = process.env['BOT_PROVIDER'];

const moduleName = '管理员';

test.before(async (t) => {
  const chatopera = new Chatopera(accessToken, botProvider);
  t.context.chatopera = chatopera;
  t.pass();
});

test('Test create chatbot', async (t) => {
  let resp = await t.context.chatopera.command('POST', '/chatbot', {
    description: 'Test',
    logo: '',
    name: 'TestBot' + Date.now(),
    primaryLanguage: 'zh_CN',
    trans_zhCN_ZhTw2ZhCn: false,
  });
  debug('chatbot %s', JSON.stringify(resp, null, " "));
  t.is(resp.rc, 0);
  t.pass();
});

test.only('Test get chatbots', async (t) => {
  let resp = await t.context.chatopera.command('GET', '/chatbot');
  debug('chatbots %s', JSON.stringify(resp, null, " "));
  t.is(resp.rc, 0);
  t.pass();
});
