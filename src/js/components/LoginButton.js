
var React = require('react/addons');

var LoginButton = React.createClass({
  render: function() {
    return (
      <div className="login-container user-box">
        <div>
          <a href="/auth/twitter">
            <img src="/images/sign-in-with-twitter-gray.png" />
          </a>
        </div>
      </div>
    );
  }
});

module.exports = LoginButton;

