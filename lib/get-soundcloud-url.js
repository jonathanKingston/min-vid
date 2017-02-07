const Request = require('sdk/request').Request;
const clientId = require('../package.json').config['SOUNDCLOUD_CLIENT_ID'];

module.exports = getSoundcloudUrl;

function getSoundcloudUrl(opts, cb) {
  Request({
    url: `https://api.soundcloud.com/resolve.json?client_id=${clientId}&url=${opts.url}`,
    onComplete: function (resp) {
      let item = {
        title: '',
        launchUrl: opts.url,
        error: false
      };

      if (resp.status === 429) {
        item.error = 'errorScTrackLimit';
      } else if (resp.status === 403) {
        item.error = 'errorScRestricted';
      } else if (!resp.json) {
        item.error = 'errorScTrackConnection';
      } else if (resp.json.kind !== 'track') {
        item.error = 'errorScTrack';
      } else if (!resp.json.streamable) {
        item.error = 'errorScStreamable';
      } else {
        item = Object.assign({
          url: resp.json.stream_url+'?client_id='+clientId,
          title: resp.json.title,
          preview: resp.json.artwork_url
        });
      }

      cb(item);
    }
  }).get();
}
