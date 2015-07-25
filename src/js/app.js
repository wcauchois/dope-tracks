
var _ = require('lodash'),
    Promise = require('bluebird'),
    React = require('react/addons'),
    services = require('./services'),
    Dispatcher = require('flux').Dispatcher,
    YouTubePlayer = require('./components/YouTubePlayer'),
    ContentItemStore = require('./stores/ContentItemStore'),
    ContentItemActions = require('./actions/ContentItemActions'),
    LoginButton = require('./components/LoginButton'),
    classNames = require('classnames'),
    Mousetrap = require('mousetrap'),
    UserStatus = require('./components/UserStatus');

function getPageState() {
  return {
    contentItems: ContentItemStore.getAll()
  };
}

var HomePage = React.createClass({
  getInitialState: function() {
    return getPageState();
  },

  componentDidMount: function() {
    ContentItemStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    ContentItemStore.removeChangeListener(this._onChange);
  },

  _onChange: function() {
    this.setState(getPageState());
  },

  render: function() {
    var userComponent;
    if (this.props.loginUser) {
      userComponent = <UserStatus user={this.props.loginUser} />;
    } else {
      userComponent = <LoginButton />;
    }
    return (
      <div>
        <div className="row">
          <div className="col-md-8">
            <h1>Dope Tracks</h1>
          </div>
          <div className="col-md-4">
            {userComponent}
          </div>
        </div>
        <AddContentControl />
        <ContentFeed items={this.state.contentItems} />
      </div>
    );
  }
});

var ContentItem = React.createClass({
  removeSelf: function() {
    ContentItemActions.removeItem(this.props.item.id);
  },

  render: function() {
    return (
      <div className="content-item">
        <h4>
          {this.props.item.title}
          &nbsp;
          <span className="btn btn-default btn-xs glyphicon glyphicon-trash"
            onClick={this.removeSelf} />
        </h4>
        <YouTubePlayer videoId={this.props.item.youtube_id}
          itemId={this.props.item.id}
          playing={this.props.item.__playing} />
      </div>
    );
  }
});

var ContentFeed = React.createClass({
  render: function() {
    var items = _.map(this.props.items, function(item) {
      return (
        <ContentItem item={item} key={item['id']} />
      );
    }, this);
    return (
      <div className="content-feed">
        {items}
      </div>
    );
  }
});

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

function registerShortcuts() {
  Mousetrap.bind('space', function(e) {
    e.preventDefault();
    ContentItemActions.togglePlaying();
  });
}

global.renderPage = function(el, params) {
  ContentItemStore.init(params.contentItems);
  React.render(
    <HomePage loginUser={params.loginUser} />,
    el
  );
};

registerShortcuts();

