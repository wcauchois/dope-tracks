var React = require('react/addons');

var SoundCloudPlayer = React.createClass({
  render: function() {
    var iframeSrc = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/" +
      this.props.soundcloudId + "&auto_play=false&hide_related=false&show_comments=true&" +
      "show_user=true&show_reposts=false&visual=true";

    return (
      <div>
        <iframe width="600" height="200" scrolling="no" frameborder="no" src={iframeSrc} />
      </div>
    );
  },

  componentDidMount: function() {
    var domNode = React.findDOMNode(this);
    this.setState({
      widget: SC.Widget(domNode.querySelector('iframe'))
    });
  }
});

module.exports = SoundCloudPlayer;

