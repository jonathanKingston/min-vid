const React = require('react');
const cn = require('classnames');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

class ReplayView extends React.Component {
  replay() {
    sendMetricsEvent('replay_view', 'replay');
    const newQueue = this.props.queue.splice(0)
    newQueue[0].currentTime = 0;

    window.AppData.set({
      queue: newQueue,
      playing: true,
      exited: false
    });
  }

  close() {
    sendMetricsEvent('replay_view', 'close');
    sendToAddon({action: 'close'});
  }

  playFromHistory() {
    sendMetricsEvent('replay_view', 'play-from-history');
    sendToAddon({action: 'play-from-history'});
  }

  render() {
    return (
        <div className={cn('exited', {hidden: !this.props.exited || this.props.minimized})}>
          <div className='row'>
            <div className='ended-dialog'>
              <p>There are no more songs in the queue. <a onClick={this.playFromHistory.bind(this)}>Play from History?</a></p>
            </div>
            <button className='exit-replay' onClick={this.replay.bind(this)}></button>
            <button className='exit-close' onClick={this.close.bind(this)}></button>
          </div>
        </div>
    );
  }
}

ReplayView.propTypes = {
  exited: React.PropTypes.bool,
  minimized: React.PropTypes.bool
}

module.exports = ReplayView;
