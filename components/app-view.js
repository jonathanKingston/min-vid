const React = require('react');
const cn = require('classnames');
const PlayerView = require('./player-view');
const LoadingView = require('./loading-view');

class AppView extends React.Component {
  render() {
    return (
        <div className='app'>
          {(!this.props.loaded) ? <LoadingView {...this.props} /> : null}

          <div className={cn('player-wrap', {hidden: !this.props.loaded})}>
            {this.props.queue.length ? (<PlayerView {...this.props} />) : null}
          </div>
        </div>
    );
  }
}

AppView.propTypes = {
  loaded: React.PropTypes.bool
};

module.exports = AppView;
