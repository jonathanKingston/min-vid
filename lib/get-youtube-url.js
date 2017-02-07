const Request = require('sdk/request').Request;
const qs = require('sdk/querystring');

module.exports = getYouTubeUrl;

function getYouTubeUrl(opts, cb) {
  Request({
    url: `https://www.youtube.com/get_video_info?video_id=${opts.videoId}`,
    onComplete: function(res) {
      // response uses '+' instead of spaces, we have to replace
      // before parsing so that we don't replace legitimate '+'s
      // after the parse.
      const result = qs.parse(res.text.split('+').join(' '));
      const item = {
        videoId: opts.videoId,
        url: `https://youtube.com/watch?v=${opts.videoId}`,
        domain: 'youtube.com',
        currentTime: opts.time,
        error: false,
        title: (result.status === 'ok') ? result.title : '',
        preview: `https://img.youtube.com/vi/${opts.videoId}/0.jpg`
      };

      if (result.status === 'fail') {
        if (result.reason.indexOf('restricted')) item.error = 'error_youtube_not_allowed';
        else item.error = 'error_youtube_not_found';
      }

      cb(item);
    }
  }).get();
}
