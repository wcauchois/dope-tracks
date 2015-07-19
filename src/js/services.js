
var Promise = require('bluebird');

module.exports = {
  youtubeSearch: function(q) {
    return Promise.resolve($.getJSON('/youtube/search', {q: q}));
  },

  addItem: function(item) {
    return Promise.resolve($.post('/item/add', item));
  },

  removeItem: function(id) {
    return Promise.resolve($.post('/item/remove', {id: id}));
  }
};

