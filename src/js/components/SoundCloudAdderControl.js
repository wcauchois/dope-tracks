var React = require('react/addons'),
    _ = require('lodash'),
    AutoSearchBox = require('./AutoSearchBox'),
    classNames = require('classnames'),
    ContentItemActions = require('../actions/ContentItemActions'),
    services = require('../services');

var SoundCloudAdderControl = React.createClass({
  getInitialState: function() {
    return {searchResults: []};
  },

  clearResults: function() {
    this.setState({searchResults: []});
  },

  handleSelected: function(result) {
    ContentItemActions.addItem({
      type: 'soundcloud',
      soundcloud_id: result.id,
      title: result.title
    });
    this.props.onItemAdded && this.props.onItemAdded();
  },

  handleSearchResult: function(data) {
    this.setState({searchResults: data.items});
  },

  render: function() {
    var results;
    if (this.state.searchResults) {
      results = _.map(this.state.searchResults, function(item) {
        return (
          <SoundCloudResult key={item.id} result={item} onSelected={this.handleSelected} />
        );
      }, this);
    }

    return (
      <div className={classNames({'dropdown-menu': true, 'hidden': this.props.hidden, 'adder-control': true})}>
        <div className="col-md-12">
          <AutoSearchBox
            placeholder="Search for a sound"
            searchFunc={services.soundcloudSearch}
            onSearchResult={this.handleSearchResult}
            doClearResults={this.clearResults} />
          {results}
        </div>
      </div>
    );
  }
});

var SoundCloudResult = React.createClass({
  handleSelection: function() {
    this.props.onSelected(this.props.result);
  },

  render: function() {
    return (
      <div>
        <div onClick={this.handleSelection}>
          {this.props.result.title}
        </div>
      </div>
    );
  }
});

module.exports = SoundCloudAdderControl;

