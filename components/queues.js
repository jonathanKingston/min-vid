const React = require('react');
const cn = require('classnames');
const Sortable = require('sortablejs');
const {Tab, Tabs, TabList, TabPanel} = require('react-tabs');
const ReactTooltip = require('react-tooltip');
const sendToAddon = require('../client-lib/send-to-addon');

// const playIcon = require('../data/img/play-blue.svg');
const playIcon = '../data/img/play-blue.svg';


Tabs.setUseDefaultStyles(false);

class Item extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hovered: false};
  }

  remove() {
    sendToAddon({
      action: 'track-removed',
      index: this.props.index
    });
  }

  enterItem() {
    this.setState({hovered: true});
  }

  leaveItem() {
    this.setState({hovered: false});
  }

  play() {
    // the goal here is to get the track index, move it to the top
    // of the queue, and play it.
    // We also need to handle the currently playing track correctly.
    //
    // If track 0 in the queue is not playing, and hasn't been
    // played at all(currentTime == 0), we should move the newTrack
    // to the top of the queue and play it.
    //
    // If track 0 in the queue is playing or has been played
    // (currentTime > 0), we should move track 0 into the history
    // array, and then move newTrack to the top of the queue
    sendToAddon({
      action: 'track-expedited',
      moveIndexZero: !window.AppData.queue[0].currentTime,
      index: this.props.index
    });
  }

  add() {
    sendToAddon({
      index: this.props.index,
      action: 'track-added-from-history'
    });
  }

  render() {
    const style = {
      backgroundImage: `url(${this.props.preview})`,
      filter: (this.state.hovered) ? 'opacity(60%) grayscale(20%)' : ''
    };

    const columnOneContent = this.props.index ? (<p>{this.props.index +1}</p>) : (<img src={playIcon} />);

    const dragHandle = (this.props.shouldDrag && this.props.index) ?
                       (<div className={cn('drag-handle', {hidden: !this.state.hovered})}></div>)
                       : null;

    return (<li className='queue-item'
                onMouseEnter={this.enterItem.bind(this)}
                onMouseLeave={this.leaveItem.bind(this)}>

              <div className='queue-item-left'>
                {dragHandle}
                {columnOneContent}
              </div>
              <div className='queue-item-thumbnail'>
                <div style={style}></div>
                <a onClick={this.play.bind(this)} className={cn('play', {hidden: !this.state.hovered})} />
              </div>
              <div className='queue-item-info'>
                <h5 className='queue-item-title' data-tip data-for={`title-${this.props.index}`}>{this.props.title}</h5>
                <ReactTooltip id={`title-${this.props.index}`} effect='solid'>
                  {this.props.title}
                </ReactTooltip>
                <span className='queue-item-domain'>{this.props.domain}</span>
                <span className='queue-item-time'>{this.props.time}</span>
                <a className={cn('queue-item-remove', {hidden: !this.state.hovered})} onClick={this.remove.bind(this)} />
              </div>
            </li>)
  }
}

class QueuesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabIndex: 0,
      keyPrefix: Math.random()
    };
  }

  handleSelect(index, last) {
    this.setState({activeTabIndex: index});
  }

  sortableContainersDecorator(componentBackingInstance) {
    const onEnd = (ev) => {
      sendToAddon({
        action: 'track-reordered',
        oldIndex: ev.oldIndex,
        newIndex: ev.newIndex
      });

      // Force react to update child components after drag completion
      // issue: https://github.com/RubaXa/Sortable/issues/908
      this.setState({keyPrefix: Math.random()});
    };

    if (componentBackingInstance) {
      Sortable.create(componentBackingInstance, {
        handle: '.drag-handle',
        onEnd: onEnd
      });
    }
  }

  render() {
    return (
        <Tabs onSelect={this.handleSelect.bind(this)} selectedIndex={this.state.activeTabIndex}
              className='queues'>
          <header>
            <TabList className='queue-headers'>
              <Tab className={cn({active:(this.state.activeTabIndex === 0)})}><h3>Play Queue</h3></Tab>
              <Tab className={cn({active:(this.state.activeTabIndex === 1)})}><h3>History</h3></Tab>
            </TabList>
            <a className='collapse-queue' onClick={this.props.closeQueueMenu.bind(this)}></a>
          </header>

          <TabPanel className='panel-wrapper'>
            <ul ref={this.sortableContainersDecorator.bind(this)}>
              {this.props.queue.map((item, i) => <Item {...item} shouldDrag={true} key={this.state.keyPrefix + i} index={i} />)}
            </ul>
          </TabPanel>

          <TabPanel className='panel-wrapper'>
            <ul ref={this.sortableContainersDecorator}>
              {this.props.history.map((item, i) => <Item {...item} key={this.state.keyPrefix + i} index={i} />)}
            </ul>
          </TabPanel>
        </Tabs>
    );
  }
}


// QueuesView.propTypes = {};

module.exports = QueuesView;
