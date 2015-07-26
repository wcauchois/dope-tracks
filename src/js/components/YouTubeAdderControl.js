var React = require('react/addons'),
    _ = require('lodash'),
    AutoSearchBox = require('./AutoSearchBox'),
    classNames = require('classnames'),
    ContentItemActions = require('../actions/ContentItemActions'),
    services = require('../services');

var YouTubeAdderControl = React.createClass({
  getInitialState: function() {
    return {searchResults: []};
  },

  handleSearchResult: function(data) {
    this.setState({searchResults: data.items});
  },

  clearResults: function() {
    this.setState({searchResults: []});
  },

  handleSelected: function(result) {
    ContentItemActions.addItem({
      youtube_id: result.id,
      title: result.title,
      description: result.description
    });
    this.props.onItemAdded && this.props.onItemAdded();
  },

  render: function() {
    var results;
    if (this.state.searchResults) {
      results = _.map(this.state.searchResults, function(item) {
        return (
          <YouTubeResult key={item.id} result={item} onSelected={this.handleSelected} />
        );
      }, this);
    }

    return (
      <div className={classNames({'dropdown-menu': true, 'hidden': this.props.hidden, 'adder-control': true})}>
        <div className="col-md-12">
          <AutoSearchBox
            placeholder="Search for a video"
            searchFunc={services.youtubeSearch}
            onSearchResult={this.handleSearchResult}
            doClearResults={this.clearResults} />
          {results}
        </div>
      </div>
    );
  }
});
var YouTubeResult = React.createClass({
  getInitialState: function() {
    return {inlinePlayerExpanded: false};
  },

  togglePlayer: function() {
    this.setState({inlinePlayerExpanded: !this.state.inlinePlayerExpanded});
  },

  componentWillUpdate: function() {
    var node = React.findDOMNode(this);
    $(node).find('.glyphicon').tooltip();
  },

  handleSelection: function() {
    this.props.onSelected(this.props.result);
  },

  render: function() {
    var chevronClass = classNames({
      'btn': true, 'btn-default': true, 'btn-xs': true, 'glyphicon': true,
      'glyphicon-chevron-right': !this.state.inlinePlayerExpanded,
      'glyphicon-chevron-down': this.state.inlinePlayerExpanded
    });
    var youtubeUrl = "https://youtube.com/watch?v=" + this.props.result.id;
    var inlinePlayer;
    if (this.state.inlinePlayerExpanded) {
      inlinePlayer = (
        <div className="inline-player">
          <iframe type="text/html" width="200" height="200"
            src={"https://www.youtube.com/embed/" + this.props.result.id} />
        </div>
      );
    }
    return (
      <div className="youtube-result">
        <span>
          <a href="#" onClick={this.handleSelection}>{this.props.result.title}</a>
          &nbsp;
          <a className="btn btn-default btn-xs glyphicon glyphicon-new-window"
            target="_blank" href={youtubeUrl} />
          <span className={chevronClass} onClick={this.togglePlayer} />
          {inlinePlayer}
        </span>
      </div>
    );
  }
});

module.exports = YouTubeAdderControl;

