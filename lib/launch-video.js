const tabs = require('sdk/tabs');
const prefs = require('sdk/simple-prefs').prefs;
const store = require('sdk/simple-storage').storage;
const getVideoId = require('get-video-id');

const isAudio = require('./is-audio');
const windowUtils = require('./window-utils');
const getRandomId = require('./get-random-id');
const getLocaleStrings = require('./get-locale-strings');

module.exports = launchVideo;

// Pass in a video URL as opts.src or pass in a video URL lookup function as opts.getUrlFn
function launchVideo(opts) {
  // UpdateWindow might create a new panel, so do the remaining launch work
  // asynchronously.
  windowUtils.updateWindow();
  windowUtils.whenReady(() => {
    const getUrlFn = opts.getUrlFn;
    const action = opts.action;

    delete opts.getUrlFn;
    delete opts.action;

    windowUtils.show();
    // send some initial data to open the loading view
    // before we fetch the media source
    windowUtils.send('set-video', opts = Object.assign({
      id: getRandomId(),
      width: prefs.width,
      height: prefs.height,
      videoId: getVideoId(opts.url) ? getVideoId(opts.url).id : '',
      volume: 0.5,
      muted: false,
      strings: getLocaleStrings(opts.domain, (isAudio(opts.url))),
      tabId: tabs.activeTab.id,
      initialLoad: true,
      launchUrl: opts.url,
      currentTime: 0
    }, opts));

    // fetch the media source and set it
    getUrlFn(opts, function(item) {
      if (item.err) console.error('LaunchVideo failed to get the streamUrl: ', item.err); // eslint-disable-line no-console

      if (isAudio(item.url)) item.player = 'audio';

      if (action === 'play') store.queue.unshift(item);
      else store.queue.push(item);

      windowUtils.send('set-video', {
        error: item.err ? item.err : false,
        initialLoad: false,
        queue: JSON.stringify(store.queue)
      });
    });
  });
}
