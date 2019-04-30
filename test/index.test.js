const test = require('ava');
const debug = require('debug')('chatopera:sdk:test');
const generate = require('../src/generate-authorization');
const Chatbot = require('../index');
const clientId = '5c134649aa257e67b216c6a5';
const clientSecret = 'b5287df035e815b59546077f4eea705f';

test('Test generate token', async t => {
  const token = generate(
    clientId,
    clientSecret,
    'POST',
    `/api/v1/chatbot/${clientId}/faq/database`
  );
  console.log('token', token);
  t.pass();
});

test('Test get chatbot detail by Id', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.detail();
  console.log('detail', resp);
  t.pass();
});

test('Test query conversation', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.conversation('nodesdk', '你好');
  console.log('conversation', resp);
  t.pass();
});

test('Test query faq', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.faq('nodesdk', '停效期间的保单是否能办理减保');
  console.log('faq', resp);
  t.pass();
});

test('Test get user list', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.users();
  console.log('users', resp);
  t.pass();
});

test.only('Test get chat history', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.chats('nodesdk');
  console.log('chats', resp);
  t.pass();
});

test('Test mute user', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.mute('nodesdk');
  console.log('mute', resp);
  t.pass();
});

test.skip('Test unmute user', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.unmute('nodesdk');
  console.log('unmute', resp);
  t.pass();
});

test('Test ismute user', async t => {
  const chatbot = new Chatbot(clientId, clientSecret);
  let resp = await chatbot.ismute('nodesdk');
  console.log('ismute', resp);
  t.pass();
});
