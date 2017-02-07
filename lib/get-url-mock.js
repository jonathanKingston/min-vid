const path = require('sdk/fs/path');

module.exports = function(opts, cb) {
  cb({
    url: opts.url,
    preview: '',
    title: decodeURIComponent(path.basename(opts.url))
  });
}
