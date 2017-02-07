const React = require('react');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const ReactPlayer = require('react-player');
const ReactTooltip = require('react-tooltip');

const AudioCtrl = require('../client-lib/audio-ctrl');
const formatTime = require('../client-lib/format-time');
const sendToAddon = require('../client-lib/send-to-addon');

const Queues = require('./queues');
const ErrorView = require('./error-view');
const ReplayView = require('./replay-view');
const PlayerControls = require('./player-controls');
const GeneralControls = require('./general-controls');

module.exports = class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hovered: false, progress: 0, exited: false,
                  time: '0:00 / 0:00', showQueue: false, historyIndex: 0};

    if (this.props.queue[0].player === 'audio') this.loadAudio();
    else this.ytConfig = {'playerVars':{'cc_load_policy': this.props.cc}};
  }

  componentDidMount() {
    this.attachKeyboardShortcuts();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.queue[0].url !== this.props.queue[0].url) {
      if (this.props.queue[0].player === 'audio') this.loadAudio();
    }
  }

  componentWillUnmount() {
    if (this.audio) this.audio.remove();
  }

  loadAudio() {
    clearTimeout(this.loadingTimeout);
    this.loadingTimeout = setTimeout(() => {
      console.error('ERROR: loading timeout');
    }, 20000);

    if (this.audio) this.audio.remove();

    this.audio = new AudioCtrl(Object.assign({}, this.props, {
      url: this.props.queue[0].url,
      time: this.props.queue[0].time,
      onError: this.onError.bind(this),
      onLoaded: this.onLoaded.bind(this),
      onEnded: this.onEnded.bind(this),
      onProgress: this.onProgress.bind(this),
      container: this.refs['audio-container']
    }));
  }

  enterPlayer() {
    this.setState({hovered: true});
  }

  leavePlayer() {
    this.setState({hovered: false});
  }

  handleVideoClick(ev) {
    // if (this.props.exited) return;
    // if (!ev.target.classList.contains('video-wrapper') && (ev.target.id !== 'audio-vis')) return;
    // if (this.props.playing) emitter.emit('pause')
    // else emitter.emit('play')
  }

  onError() {
    window.AppData.set({error: true});
  }

  onEnded() {
    if (this.props.queue.length === 1) {
      window.AppData.set({exited: true});
    } else sendToAddon({action: 'track-ended'});
  }

  onLoaded(duration) {
    clearTimeout(this.loadingTimeout);
    window.AppData.set({loaded: true, exited: false});
    if (duration) {
      window.AppData.set({duration: duration});
      this.onProgress({played: 0});
    }
  }

  onProgress(ev) {
    this.setState({
      progress: ev.played,
      time: `${formatTime(window.AppData.duration * ev.played)} / ${formatTime(window.AppData.duration)}`
    });
  }

  setTime(ev) {
    ev.stopPropagation();
    const x = ev.pageX - ev.target.offsetLeft;
    const clickedValue = x * ev.target.max / ev.target.offsetWidth;
    // app-data needs to be required here instead of the top of the
    // module in order to avoid a circular dependency

    const nextTime = window.AppData.duration * clickedValue;

    if (this.audio) this.audio.time = nextTime;
    window.AppData.set({currentTime: nextTime});
    if (this.refs['player']) this.refs['player'].seekTo(clickedValue);
  }

  openQueueMenu() {
    this.setState({showQueue: true});
  }

  closeQueueMenu() {
    this.setState({showQueue: false});
  }

  prevTrack () {
    let index;
    // if clicked more than once within
    // 5 seconds increment the index so
    // the user can get to further back
    // in history. Resets when timeout wears out.
    if (this.searchingHistory) {
      if (this.props.history.length > this.state.historyIndex + 1) {
        this.setState({historyIndex: this.state.historyIndex + 1});
      }
      index = this.state.historyIndex;
    } else {
      index = 0;
      this.searchingHistory = true;
      setTimeout(() => {
        this.searchingHistory = false;
        this.setState({historyIndex: 0});
      }, 5000);
    }

    sendToAddon({
      action: 'track-added-from-history',
      index: index
    });
  }

  nextTrack () {
    if (this.props.queue.length < 2) return;
    sendToAddon({
      action: 'track-expedited',
      index: 1,
      moveIndexZero: true
    });
  }

  handleSpace() {
    window.AppData.set({playing: !window.AppData.playing});
    if (this.audio) {
      if (this.audio.playing) this.audio.pause();
      else this.audio.play();
    }
  }

  render () {
    const visualEl = this.props.queue[0].error ? (<ErrorView {...this.props} />) :
          this.props.queue[0].player === 'audio' ?
          (<div id='audio-container' ref='audio-container' onClick={this.handleVideoClick.bind(this)}/>) :
          (<ReactPlayer {...this.props} url={this.props.queue[0].url} ref='player'
                        onProgress={this.onProgress.bind(this)}
                        onReady={this.onLoaded.bind(this)}
                        onDuration={(d) => window.AppData.set({duration: d})}
                        youtubeConfig={this.ytConfig} progressFrequency={100}
                        onError={this.onError.bind(this)}
                        onEnded={this.onEnded.bind(this)}
           />);

    const queuePanel = this.state.showQueue ? (<Queues className={cn({hidden: !this.state.showQueue})}
                                               {...this.props} closeQueueMenu={this.closeQueueMenu.bind(this)}/>)
                                            : null;

    const generalControls = this.state.hovered ? <GeneralControls {...this.props} hovered={this.state.hovered}
                                                 openQueueMenu={this.openQueueMenu.bind(this)} />
                                               : null;

    const prevTrackBtn = (<div className={cn('prev-wrapper', {hidden: !this.state.hovered})}>
                            <a onClick={this.prevTrack.bind(this)}
                               className='prev' data-tip data-for='prev' />
                            <ReactTooltip id='prev' effect='solid' place='right'>{this.props.strings.ttPrev}</ReactTooltip>
                          </div>);
    const nextTrackBtn = (<div className={cn('next-wrapper', {hidden: !this.state.hovered || (this.props.queue.length < 2)})}>
                            <a onClick={this.nextTrack.bind(this)}
                               className='next' data-tip data-for='next' />
                            <ReactTooltip id='next' effect='solid' place='right'>{this.props.strings.ttNext}</ReactTooltip>
                          </div>);

    // const keyHandlers = (<div>
    //                      <KeyHandler keyEventName={KeyHandler.KEYPRESS} keyValue="space" onKeyHandle={this.handleSpace.bind(this)} />
    //                      </div>);

    return (<div className='video-wrapper'
                 onMouseEnter={this.enterPlayer.bind(this)}
                 onMouseLeave={this.leavePlayer.bind(this)}
                 onClick={this.handleVideoClick.bind(this)}>
              {this.props.exited ? <ReplayView {...this.props} exited={this.props.exited} /> : null}
              {prevTrackBtn}
              {nextTrackBtn}
              {generalControls}
              <PlayerControls {...this.props} hovered={this.state.hovered} progress={this.state.progress}
                              audio={this.audio} time={this.state.time} setTime={this.setTime.bind(this)}
                              closeQueueMenu={this.closeQueueMenu.bind(this)} />
              {queuePanel}
              {visualEl}
            </div>);
  }

  attachKeyboardShortcuts() {
    // seek forward
    keyboardJS.bind('right', ev => {
      if (this.refs['player']) this.refs['player'].seekTo((this.props.currentTime + 5) / window.AppData.duration);
      if (this.audio) this.audio.time = this.props.currentTime + 5;
      window.AppData.set({currentTime: this.props.currentTime + 5});
    });

    // seek backward
    keyboardJS.bind('left', ev => {
      if (this.refs['player']) this.refs['player'].seekTo((this.props.currentTime - 5) / window.AppData.duration);
      if (this.audio) this.audio.time = this.props.currentTime - 5;
      window.AppData.set({currentTime: this.props.currentTime - 5});
    });

    // next track
    keyboardJS.bind('>', ev => {
      this.nextTrack();
    });

    // previous track
    keyboardJS.bind('<', ev => {
      this.prevTrack();
    });

    // play/pause toggle
    keyboardJS.bind('space', ev => {
      if (this.audio) {
        if (window.AppData.playing) this.audio.pause();
        else this.audio.play();
      }
      window.AppData.set({playing: !window.AppData.playing});
    });
  }
}
