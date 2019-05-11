const archiver = require("archiver");
const fs = require("fs");

/**
 * [getTimestamp description]
 * @return {[type]} [description]
 */
exports.getTimestamp = function() {
  var now = new Date();
  return (
    now.getFullYear().toString() +
    (now.getMonth() + 1) +
    now.getDate() +
    "-" +
    now.getHours() +
    (now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()) +
    (now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds())
  );
};

/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
exports.zipDirectory = function(source, out) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", err => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
};

/**
 * Shortcuts for HTTP Methods
 */
exports.HTTP_METHOD = {
  POST: "POST",
  GET: "GET",
  DELETE: "DELETE",
  PUT: "PUT",
  PATCH: "PATCH"
};
