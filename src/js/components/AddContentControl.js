var React = require('react/addons'),
    YouTubeAdderControl = require('./YouTubeAdderControl'),
    DropdownMenu = require('./DropdownMenu'),
    classNames = require('classnames');

var AddContentControl = React.createClass({
  getInitialState: function() {
    return {mode: 'default', dropdownOpen: false};
  },

  switchToMode: function(newMode, event) {
    this.setState({mode: newMode});
    event.preventDefault();
  },

  onDropdownToggle: function(newOpen) {
    var newState = {dropdownOpen: newOpen};
    if (!newOpen) {
      newState.mode = 'default';
    }
    this.setState(newState);
  },

  onItemAdded: function() {
    this.setState({dropdownOpen: false});
  },

  render: function() {
    var buttonContent = (
      <span>
        <span className="glyphicon glyphicon-plus" /> Add a track <span className="caret" />
      </span>
    );

    var dropdownContent = [
      (
        <ul className={classNames({'dropdown-menu': true, 'hidden': this.state.mode !== 'default'})} key='default'>
          <li><a href="#" onClick={this.switchToMode.bind(this, 'youtube')}>YouTube Video</a></li>
        </ul>
      ),
      <YouTubeAdderControl hidden={this.state.mode !== 'youtube'} key='youtube'
        onItemAdded={this.onItemAdded} />
    ];

    return (
      <div className="row">
        <div className="col-md-5 col-xs-12">
          <DropdownMenu buttonContent={buttonContent} dropdownContent={dropdownContent}
            onDropdownToggle={this.onDropdownToggle} open={this.state.dropdownOpen} />
        </div>
      </div>
    );
  }
});

module.exports = AddContentControl;

