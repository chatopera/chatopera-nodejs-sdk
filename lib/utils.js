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
const { ZipArchive } = require('archiver');
const fs = require('fs');
const yaml = require('js-yaml');
const Joi = require('joi');
const readlineq = require('readlineq').default;

// some const settings
exports.DEFAULT_BOT_PROVIDER = "https://bot.chatopera.com";
exports.DEFAULT_BOT_LANG = "zh_CN";
exports.DEFAULT_CACHED_DIR = ".cde";
exports.CHATOPERA_JSON_FNAME = "chatopera.json"

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
  const archive = new ZipArchive({
    zlib: { level: 9 },
  });
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

/**
 * 在文件结尾，增加行
 * @param {*} lines 
 */
exports.appendFileLines = (filePath, lines) => {
  return fs.appendFileSync(filePath, lines.join("\r\n"))
}

/**
 * 将制定路径的文件，读取为 JSONObject
 * @param {*} fpath 
 * @param {*} encoding 
 * @returns 
 */
exports.readJSONFile = (fpath, encoding = 'utf8') => {
  return new Promise((resolve, reject) => {
    fs.readFile(fpath, encoding, function (err, data) {
      if (err) return reject(err);
      resolve(JSON.parse(data));
    });
  })
}

/**
 * 将 JSONObject 写入到指定的路径
 * @param {*} fpath 
 * @param {*} obj 
 * @param {*} encoding 
 */
exports.writeJSONFile = (fpath, obj, encoding = 'utf8') => {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(obj, null, 2);
    fs.writeFile(fpath, jsonData, encoding, (err) => {
      if (err) {
        console.error('Error writing to file', err);
        return reject(err);
      } else {
        resolve();
      }
    });
  })
}

/**
 * 复制文件，同时考虑文件存在时，进行覆盖，而不用删除。
 */
exports.copyConsiderringOverwrite = (srcFile, destFile, encoding = "utf8") => {
  if (fs.existsSync(destFile)) {
    let srcContent = readlineq(srcFile).join("");

    // 文件存在：打开后重写，覆盖旧内容
    fs.writeFileSync(destFile, srcContent, { encoding: encoding, flag: 'w' })
  } else {
    // 复制
    fs.copyFileSync(srcFile, destFile);
  }

}