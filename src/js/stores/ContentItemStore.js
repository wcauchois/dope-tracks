
var EventEmitter = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/AppDispatcher'),
    ContentItemConstants = require('../constants/ContentItemConstants'),
    _ = require('lodash');

var _items = [];
var _currentlyPlaying = null;

var CHANGE_EVENT = 'change';

function findItem(id) {
  return _.find(_items, function(item) { return item.id === id; });
}

var ContentItemStore = _.extend({}, EventEmitter.prototype, {
  getAll: function() {
    return _items;
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  setPlaying: function(id, value) {
    var needsChange = false;
    var item = findItem(id);
    item.__playing = value;
    if (value) {
      if (_currentlyPlaying && _currentlyPlaying !== id) {
        findItem(_currentlyPlaying).__playing = false;
        needsChange = true;
      }
      _currentlyPlaying = id;
    }
    if (needsChange) {
      this.emitChange();
    }
  }
});

AppDispatcher.register(function(action) {
  switch (action.actionType) {
    case ContentItemConstants.TOGGLE_CURRENT_VIDEO:
      var current = findItem(_currentlyPlaying);
      if (current) {
        current.__playing = !current.__playing;
      }
      ContentItemStore.emitChange();
      break;
    case ContentItemConstants.PLAY_NEXT_VIDEO:
      if (_currentlyPlaying) {
        _.zip(_items, _.tail(_items)).forEach(function(pair) {
          if (pair[0].id === _currentlyPlaying) {
            _.defer(function() {
              ContentItemStore.setPlaying(pair[1].id, true);
            });
            return;
          }
        });
      }
      break;
    case ContentItemConstants.ITEM_CREATE:
      _items.shift(action.item);
      ContentItemStore.emitChange();
      break;
    case ContentItemConstants.ITEM_REMOVE:
      _items = _.filter(_items, function(item) { return item.id !== action.id });
      ContentItemStore.emitChange();
      break;
  }
});

ContentItemStore.init = function(items) {
  _items = items;
};

module.exports = ContentItemStore;

