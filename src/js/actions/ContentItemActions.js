
var AppDispatcher = require('../dispatcher/AppDispatcher'),
    ContentItemConstants = require('../constants/ContentItemConstants'),
    services = require('../services');

var ContentItemActions = {
  playNextVideo: function() {
    AppDispatcher.dispatch({
      actionType: ContentItemConstants.PLAY_NEXT_VIDEO
    });
  },

  addItem: function(item) {
    services.addItem(item).then(function(serverItem) {
      AppDispatcher.dispatch({
        actionType: ContentItemConstants.ITEM_CREATE,
        item: serverItem
      });
    });
  },

  removeItem: function(id) {
    services.removeItem(id).then(function() {
      AppDispatcher.dispatch({
        actionType: ContentItemConstants.ITEM_REMOVE,
        id: id
      });
    });
  },

  togglePlaying: function() {
    AppDispatcher.dispatch({
      actionType: ContentItemConstants.TOGGLE_CURRENT_VIDEO,
    });
  },

  pauseVideo: function(id) {
    AppDispatcher.dispatch({
      actionType: ContentItemConstants.PLAYER_STOPPED,
      id: id
    });
  },

  playVideo: function(id) {
    AppDispatcher.dispatch({
      actionType: ContentItemConstants.PLAYER_STARTED,
      id: id
    });
  }
};

module.exports = ContentItemActions;

