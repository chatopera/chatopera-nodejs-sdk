/**
 * Test Chatbot API
 */

const test = require('ava');
const chatbot = require('../src/client');

test.beforeEach(t => {
  t.context.chatbotID = '5c134649aa257e67b216c6a5';
  t.context.faqDocId = 'AWZ3PDTUNZQ8InLms5Qu';
});

test('Chatbot Test#get bot by chatbotID', async t => {
  let response = await chatbot.getChatbotById(t.context.chatbotID);
  console.log('bot detail:', response);
  t.pass();
});

test.skip('Chatbot Test#create faq pair by chatbotID', async t => {
  let response = await chatbot.createFaqPair(t.context.chatbotID, {
    post: '怎么开通微信支付?',
    reply:
      '登录微信公众号平台，点击左侧微信支付菜单栏，按照开通步骤开通微信支付',
    enabled: true,
  });
  console.log('faq pair:', response);
  t.pass();
});

test('Chatbot Test#get faq detial', async t => {
  let response = await chatbot.getFaqPairDetail(
    t.context.chatbotID,
    t.context.faqDocId
  );
  console.log('getFaqPairDetail', response);
  t.pass();
});

test('Chatbot Test#update faq pair', async t => {
  let response = await chatbot.updateFaqPair(
    t.context.chatbotID,
    t.context.faqDocId,
    {
      post: '怎么开通支付宝支付?',
      reply:
        '登录支付宝企业平台，点击左侧微信支付菜单栏，按照开通步骤开通微信支付',
      enabled: true,
    }
  );

  console.log('updateFaqPair', response);
  t.pass();
});

test('Chatbot Test#get faq lists', async t => {
  let response = await chatbot.getFaqPairs(t.context.chatbotID, {
    page: 1,
    limit: 10,
  });
  t.true(response.data.length >= 0, 'Wrong doc length.');
  t.pass();
});

test.skip('Chatbot Test#delete faq pair', async t => {
  let response = await chatbot.delFaqPair(
    t.context.chatbotID,
    'AWZ3ebuvNZQ8InLms5Q5'
  );
  console.log('delete faq pair', response);
  t.pass();
});

test('Chatbot Test#create faq extend by chatbotID and docId', async t => {
  let response = await chatbot.createFaqPairExtend(
    t.context.chatbotID,
    t.context.faqDocId,
    {
      post: '怎样支持微信支付?',
    }
  );
  console.log('createFaqPairExtend', response);
  t.pass();
});

test('Chatbot Test#get faq pair extends', async t => {
  let response = await chatbot.getFaqPairExtends(
    t.context.chatbotID,
    t.context.faqDocId
  );
  console.log('getFaqPairExtends', response);
  t.pass();
});

test.skip('Chatbot Test#update faq pair extend', async t => {
  let response = await chatbot.updateFaqPairExtend(
    t.context.chatbotID,
    t.context.faqDocId,
    'AWaFuQL-NZQ8InLms5SA',
    {
      post: '怎样接入微信支付？',
    }
  );
  t.is(response.rc, 0, 'Wrong response code');
  console.log('updateFaqPairExtend', response);
  t.pass();
});

test.skip('Chatbot Test#delete faq pair extend', async t => {
  let response = await chatbot.delFaqPairExtend(
    t.context.chatbotID,
    t.context.faqDocId,
    'AWaFuaS6NZQ8InLms5SG'
  );
  t.is(response.rc, 0, 'Wrong response code');
  console.log('delFaqPairExtend', response);
  t.pass();
});

test.skip('Chatbot Test#create synonyms', async t => {
  let response = await chatbot.createFaqSynonyms(t.context.chatbotID, {
    text: '番茄',
    neighbors: ['西红柿', '狼桃'],
  });
  console.log('createFaqSynonyms', response);
  t.is(response.rc, 0, 'Wrong response code');
  t.pass();
});
