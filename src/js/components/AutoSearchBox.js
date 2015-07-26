var React = require('react/addons'),
    _ = require('lodash'),
    classNames = require('classnames');

var AutoSearchBox = React.createClass({
  getInitialState: function() {
    return {
      queryString: '',
      inProgressXHR: null,
      lastXHRQuery: null,
      lastXHRTimestamp: null,
      loading: false
    };
  },

  maybeSearch: function(q) {
    if (q.length > 3 && !this.state.inProgressXHR) {
      var now = new Date().getTime();
      var requiredDelay = AutoSearchBox.MINIMUM_DELAY - (now - this.state.lastXHRTimestamp);
      if (requiredDelay > 0) {
        // Theoretically multiple timeouts could pile up, but maybeSearch would just detect that
        // the first one spun up an XHR.
        setTimeout(function() {
          this.setState(this.maybeSearch(this.state.queryString));
        }.bind(this), requiredDelay);
      } else {
        var xhr = this.props.searchFunc(q);
        xhr.then(function(data) {
          var newState = {
            inProgressXHR: null,
            loading: false
          };
          if (this.state.queryString !== this.state.lastXHRQuery) {
            _.extend(newState, this.maybeSearch(this.state.queryString));
          }
          this.setState(newState);
          this.props.onSearchResult(data);
        }.bind(this));
        return {
          loading: true,
          lastXHRQuery: q,
          inProgressXHR: xhr,
          lastXHRTimestamp: new Date().getTime()
        };
      }
    } else {
      return {};
    }
  },

  handleChange: function(event) {
    var q = event.target.value;
    var newState = {queryString: q};
    if (q === '') {
      this.props.doClearResults && this.props.doClearResults();
    } else {
      _.extend(newState, this.maybeSearch(q));
    }
    this.setState(newState);
  },

  render: function() {
    var classes = classNames({
      'form-control': true,
      'loading-input': this.state.loading,
      'auto-search-box': true
    });

    return (
      <input type="text" className={classes} placeholder={this.props.placeholder}
        value={this.state.queryString} onChange={this.handleChange} />
    );
  }
});

AutoSearchBox.MINIMUM_DELAY = 500; // Milliseconds

module.exports = AutoSearchBox;

