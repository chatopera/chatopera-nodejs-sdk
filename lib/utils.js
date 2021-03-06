/**
 * Chatopera Node.js SDK
 * Copyright 2020 Chatopera Inc. <https://www.chatopera.com>. All rights reserved.
 * This software and related documentation are provided under a license agreement containing
 * restrictions on use and disclosure and are protected by intellectual property laws.
 * Except as expressly permitted in your license agreement or allowed by law, you may not use,
 * copy, reproduce, translate, broadcast, modify, license, transmit, distribute, exhibit, perform,
 * publish, or display any part, in any form, or by any means. Reverse engineering, disassembly,
 * or decompilation of this software, unless required by law for interoperability, is prohibited.
 */
const archiver = require('archiver');
const fs = require('fs');
const yaml = require('js-yaml');
const Joi = require('joi');

exports.sleep = function (seconds = 3) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000 * seconds);
  });
};

/**
 * [getTimestamp description]
 * @return {[type]} [description]
 */
exports.getTimestamp = function () {
  var now = new Date();
  return (
    now.getFullYear().toString() +
    (now.getMonth() + 1) +
    now.getDate() +
    '-' +
    now.getHours() +
    (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()) +
    (now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds())
  );
};

/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
exports.zipDirectory = function (source, out) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', (err) => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};

const schemaQuestions = Joi.array().items(
  Joi.object({
    post: Joi.string().required(),
    categoryTexts: Joi.string(),
    extends: Joi.array().items(Joi.string()),
    replies: Joi.array()
      .required()
      .items(
        Joi.object({
          content: Joi.string().required(),
          rtype: Joi.string().required(),
          enabled: Joi.boolean().required(),
        })
      )
      .min(1)
      .length(1),
    enabled: Joi.boolean().required(),
  })
);

exports.mapFaqFromYaml = function (yamlSource) {
  const data = yaml.load(yamlSource);

  const result = {};
  const resultValidSchema = {};

  for (const repoFullName in data) {
    const repoFaq = data[repoFullName];

    const questions = [];
    for (const post in repoFaq) {
      const value = repoFaq[post];
      const categoryTexts = value.categories && value.categories.split('/');
      const replies = value.answers.map((a) => {
        return {
          rtype: 'plain',
          content: a,
          enabled: true,
        };
      });

      questions.push({
        post,
        categoryTexts,
        replies,
        extends: value.extends,
        enabled: true,
      });
    }

    result[repoFullName] = questions;
    resultValidSchema[repoFullName] = schemaQuestions;
  }

  const verification = Joi.object(resultValidSchema).validate(result);
  if (verification.error) {
    throw verification.error;
  }

  return result;
};
