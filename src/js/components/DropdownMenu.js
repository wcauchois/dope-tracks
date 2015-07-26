
var React = require('react/addons'),
    classNames = require('classnames');

var DropdownMenu = React.createClass({
  toggleDropdown: function() {
    this.props.onDropdownToggle(!this.props.open);
  },

  render: function() {
    return (
      <div className={classNames({'btn-group': true, 'open': this.props.open})}
        style={{width: '100%'}}>
        <button type="button" className="btn btn-default dropdown-toggle" onClick={this.toggleDropdown}>
          {this.props.buttonContent}
        </button>
        {this.props.dropdownContent}
      </div>
    );
  }
});

module.exports = DropdownMenu;

