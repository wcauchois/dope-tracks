
var React = require('react/addons'),
    ContentItemActions = require('../actions/ContentItemActions'),
    ContentItemStore = require('../stores/ContentItemStore');

var apiReady = false;
var readyListeners = [];
var lastId = 0;

function ensureApiReady(func) {
  if (apiReady) {
    func();
  } else {
    readyListeners.push(func);
  }
}

var YouTubePlayer = React.createClass({
  getInitialState: function() {
    return {
      player: null,
      playerId: lastId++,
      playing: !!this.props.playing
    };
  },

  getDOMId: function() {
    return "youtube-player-" + this.state.playerId;
  },

  render: function() {
    return (
      <div id={this.getDOMId()} className="youtube-player" />
    );
  },

  onPlayerStateChange: function(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.setState({playing: true});
      ContentItemStore.setPlaying(this.props.itemId, true);
    } else if (event.data === YT.PlayerState.PAUSED) {
      this.setState({playing: false});
      ContentItemStore.setPlaying(this.props.itemId, false);
    } else if (event.data === YT.PlayerState.ENDED) {
      ContentItemActions.playNextVideo();
    }
  },

  componentWillUpdate: function(nextProps, nextState) {
    var newPlaying = (nextProps.playing !== nextState.playing) ? nextProps.playing : nextState.playing;
    if (this.state.playing && !newPlaying) {
      this.state.player.pauseVideo();
    } else if (!this.state.playing && newPlaying) {
      this.state.player.playVideo();
    }
  },

  componentDidMount: function() {
    ensureApiReady(function() {
      var node = React.findDOMNode(this);
      var player = new YT.Player(this.getDOMId(), {
        width: 400,
        height: 300,
        videoId: this.props.videoId,
        events: {
          onStateChange: this.onPlayerStateChange
        }
      });

      if (this.state.playing) {
        player.playVideo();
      }

      this.setState({player: player});
    }.bind(this));
  }
});

(function() {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})();

global.onYouTubeIframeAPIReady = function() {
  apiReady = true;
  readyListeners.forEach(function(listener) {
    listener();
  });
  readyListeners = null;
}

module.exports = YouTubePlayer;

