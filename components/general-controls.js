const React = require('react');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const ReactTooltip = require('react-tooltip');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

function getView() {
  if (window.AppData.error) return 'error_view';
  return window.AppData.loaded ? 'player_view' : 'loading_view';
}

class GeneralControls extends React.Component {
  componentDidMount() {
    // minimized/maximize toggle keyboard shortcut
    keyboardJS.bind('M', ev => {
      if (window.AppData.minimized) this.maximize();
      else this.minimize();
    });
  }

  close() {
    sendMetricsEvent(getView(), 'close');
    sendToAddon({action: 'close'});
  }

  minimize() {
    sendMetricsEvent(getView(), 'minimize');
    sendToAddon({action: 'minimize'});
    window.AppData.set({minimized: true});
  }

  maximize() {
    sendMetricsEvent(getView(), 'maximize');
    sendToAddon({action: 'maximize'});
    window.AppData.set({minimized: false});
  }

  sendToTab() {
    sendMetricsEvent(getView(), 'send_to_tab');
    let currentTime = 0;

    if (getView() === 'player_view') {
      currentTime = window.AppData.time;
    }

    sendToAddon({
      action: 'send-to-tab',
      id: window.AppData.queue[0].id,
      domain: window.AppData.queue[0].domain,
      time: currentTime,
      tabId: window.AppData.tabId,
      url: window.AppData.queue[0].url
    });

    // I can probably remove this line,
    // I'm guessing we should probably call reset at this point, or
    // just leave this alone since it will be closing the window regardless
    // appData.set({error: false});
  }

  render() {
    return (
        <div className='controls drag'>
          <div className='left'>
            <a className='close' onClick={this.close.bind(this)} data-tip data-for='close' />
            <ReactTooltip id='close' effect='solid' place='left'>{this.props.strings.ttClose}</ReactTooltip>
          </div>

          <div className='right'>
            <a onClick={this.sendToTab.bind(this)} data-tip data-for='sendToTab' className='tab'/>
            <ReactTooltip id='sendToTab' effect='solid' place={!this.props.minimized ? 'bottom': 'left'}>
              {this.props.strings.ttSendToTab}
            </ReactTooltip>

            <a className={cn('minimize', {hidden: this.props.minimized})}
               onClick={this.minimize.bind(this)} data-tip data-for='minimize' />
            <ReactTooltip id='minimize' effect='solid' place='left'>{this.props.strings.ttMinimize}</ReactTooltip>

            <a className={cn('maximize', {hidden: !this.props.minimized})}
               onClick={this.maximize.bind(this)} data-tip data-for='maximize' />
            <ReactTooltip id='maximize' effect='solid' place='left'>{this.props.strings.ttMaximize}</ReactTooltip>

            <a className='open-queue' onClick={this.props.openQueueMenu} data-tip data-for='open-queue-menu' />
            <ReactTooltip id='open-queue-menu' effect='solid' place='left'>{this.props.strings.ttOpenQueue}</ReactTooltip>
          </div>
      </div>
    );
  }
}

GeneralControls.propTypes = {
  strings: React.PropTypes.object,
  minimized: React.PropTypes.bool
};

module.exports = GeneralControls;
