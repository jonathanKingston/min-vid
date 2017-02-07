const AudioSource = require('audiosource');
const createWaveform = require('gl-waveform');

module.exports = class AudioCtrl {
  constructor(options) {
    this.prevVolume = 0.5;
    this.onProgress = options.onProgress;
    this.onEnded = () => {
      this.pause();
      options.onEnded();
    }

    this.audio = new AudioSource({
      src: options.url,
      volume: options.volume || this.prevVolume,
      onLoad: (err) => {
        if (err) options.onError();
        options.onLoaded(this.duration);

        this.data = new Float32Array(this.audio.analyser.fftSize);
        this.waveform = createWaveform({
          container: document.getElementById('audio-container'),
          samples: this.audio.getFloatTimeDomainData(this.data)
        });

        this._loop();

        if (options.playing) this.audio.play();
      }
    });
  }

  get time() {
    return this.audio.currentTime;
  }

  set time(t) {
    this.audio.currentTime = t;
  }

  get duration() {
    return this.audio.duration;
  }

  get volume() {
    return this.audio.volume;
  }

  set volume(v) {
    this.audio.volume = v;
  }

  get playing() {
    return this.audio.playing;
  }

  play() {
    this.audio.play();
    this._loop();
  }

  pause() {
    cancelAnimationFrame(this.af);
    this.audio.pause();
  }

  _loop() {
    if (this.audio.currentTime > this.audio.duration) return this.onEnded();
    this.af = requestAnimationFrame(this._loop.bind(this));

    this.audio.getFloatTimeDomainData(this.data);
    this.waveform.push(this.data);
    this.onProgress({played: this.audio.currentTime / this.audio.duration});
  }

  mute() {
    if (this.prevVolume !== 0) {
      this.prevVolume = this.volume;
    }

    window.AppData.set({
      volume: this.volume = 0
    });
  }

  unmute() {
    window.AppData.set({
      volume: this.volume = this.prevVolume !== 0 ? this.prevVolume : 0.5
    });
  }

  remove() {
    this.audio.remove();
    delete this.waveform;
    delete this.data;
  }
}
