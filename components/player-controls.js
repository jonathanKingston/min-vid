const React = require('react');
const ReactTooltip = require('react-tooltip');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

class PlayerControls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      exited: false,
      showVolume: false,
      prevVolume: 0.5
    };
  }

  componentDidMount() {
    // mute/unmute toggle keyboard shortcut
    keyboardJS.bind('m', ev => {
      if (window.AppData.muted) this.unmute();
      else this.mute();
    });
  }

  enterSound() {
    this.setState({showVolume: true});
  }

  leaveSound() {
    this.setState({showVolume: false});
  }

  play() {
    // TODO: Handle replay
    sendMetricsEvent('player_view', 'play');
    if (this.props.audio) this.props.audio.play();
    window.AppData.set({playing: true});
  }

  pause() {
    sendMetricsEvent('player_view', 'pause');
    if (this.props.audio) this.props.audio.pause();
    window.AppData.set({playing: false});
  }

  mute() {
    sendMetricsEvent('player_view', 'mute');
    this.setState({prevVolume: this.props.volume});
    if (this.props.audio) this.props.audio.mute();
    window.AppData.set({muted: true, volume: 0});
  }

  unmute() {
    sendMetricsEvent('player_view', 'unmute');
    if (this.props.audio) this.props.audio.unmute();
    window.AppData.set({muted: false, volume: this.state.prevVolume});
  }

  setVolume(ev) {
    const value = parseFloat(ev.target.value);
    const muted = (value === 0);

    window.AppData.set({
      volume: ev.target.value
    });

    if (this.props.audio) this.props.audio.volume = value;

    if (muted && !this.props.muted) {
      window.AppData.set({muted: true});
    } else if (!muted && this.props.muted) {
      window.AppData.set({muted: false});
    }
  }

  render() {
    const playback = (
        <div className={cn('playback-button', {hidden: this.props.minimized || !this.props.hovered})}>
          <a onClick={this.play.bind(this)} data-tip data-for='play'
             className={cn('play', {hidden: this.props.playing})} />
          <ReactTooltip id='play' effect='solid' place='right'>{this.props.strings.ttPlay}</ReactTooltip>
          <a onClick={this.pause.bind(this)} data-tip data-for='pause'
             className={cn('pause', {hidden: !this.props.playing})} />
          <ReactTooltip id='pause' effect='solid' place='right'>{this.props.strings.ttPause}</ReactTooltip>
        </div>
    );

    const progress = (
        <div className={cn('progress', {hidden: this.props.minimized, peek: !this.props.hovered})}>
          <span className={cn('domain', {hidden: !this.props.hovered})}>{this.props.queue[0].domain}</span>
          <div className={cn('time', {pointer: this.props.player === 'audio', hidden: !this.props.hovered})}>{this.props.time}</div>
          <progress className='video-progress' onClick={this.props.setTime.bind(this)}
                    value={this.props.progress + ''}  />
        </div>
    );

    const soundControl = (
        <div className={cn('sound-control', {hidden: this.props.minimized || !this.props.hovered})}
             onMouseEnter={this.enterSound.bind(this)} onMouseLeave={this.leaveSound.bind(this)}>
          <a onClick={this.mute.bind(this)} data-tip data-for='mute'
             className={cn('mute', {hidden: this.props.muted})} />
          <ReactTooltip id='mute' effect='solid' place={!this.props.minimized ? 'bottom': 'right'}>
            {this.props.strings.ttMute}
          </ReactTooltip>
          <a onClick={this.unmute.bind(this)} data-tip data-for='unmute'
             className={cn('unmute', {hidden: !this.props.muted})} />
          <ReactTooltip id='unmute' effect='solid' place={!this.props.minimized ? 'bottom': 'right'}>
            {this.props.strings.ttUnmute}
          </ReactTooltip>

          <div className={cn('volume', {hidden: !this.state.showVolume})}>
            <input type='range' orient='vertical' min='0' max='1' step='.01'
                   value={this.props.muted ? 0 : this.props.volume}
                   onChange={this.setVolume.bind(this)}/>
          </div>
        </div>
    );

    return (<div className='player-controls'>{playback}{progress}{soundControl}</div>);
  }
}

// PlayerControls.propTypes = {
//   muted: React.PropTypes.bool,
//   exited: React.PropTypes.bool,
//   volume: React.PropTypes.number,
//   playing: React.PropTypes.bool,
//   hovered: React.PropTypes.bool,
//   strings: React.PropTypes.object,
//   minimized: React.PropTypes.bool,
// };

module.exports = PlayerControls;
