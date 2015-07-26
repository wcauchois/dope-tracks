
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
    UserStatus = require('./components/UserStatus'),
    AddContentControl = require('./components/AddContentControl');

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
    ContentItemStore.addChangeListener(this.onChange_);
  },

  componentWillUnmount: function() {
    ContentItemStore.removeChangeListener(this.onChange_);
  },

  onChange_: function() {
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
    var itemControl;
    var siteIconUrl;
    if (this.props.item.type === 'youtube') {
      itemControl = <YouTubeContentItem item={this.props.item} />;
      siteIconUrl = '/images/site-icons/youtube.png';
    } else if (this.props.item.type === 'soundcloud') {
      itemControl = <SoundCloudContentItem item={this.props.item} />;
      siteIconUrl = '/images/site-icons/soundcloud.png';
    }


    return (
      <div className="content-item">
        <h4>
          <img className="site-icon" src={siteIconUrl} />
          {this.props.item.title}
          &nbsp;
          <span className="btn btn-default btn-xs glyphicon glyphicon-trash"
            onClick={this.removeSelf} />
        </h4>
        {itemControl}
      </div>
    );
  }
});

var SoundCloudContentItem = React.createClass({
  render: function() {
    return (
      <div>
        TODO
      </div>
    );
  }
});

var YouTubeContentItem = React.createClass({
  render: function() {
    return (
      <div>
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

