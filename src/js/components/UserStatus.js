
var React = require('react/addons');

var UserStatus = React.createClass({
  render: function() {
    return (
      <div className="user-status-container user-box">
        <div>
          <h4>{this.props.user.display_name}</h4>
          <a href="/logout">Log out</a>
        </div>
      </div>
    );
  }
});

module.exports = UserStatus;

