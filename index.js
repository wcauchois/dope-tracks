
var express = require('express'),
    morgan = require('morgan'),
    Promise = require('bluebird'),
    config = require('config'),
    util = require('util'),
    bodyParser = require('body-parser'),
    expressHandlebars = require('express-handlebars'),
    mongoose = require('mongoose'),
    url = require('url'),
    _ = require('lodash'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session);

var request = Promise.promisify(require('request'));

// Use like request(...).caught(clientError, function(e) { ... })
function clientError(e) {
  return e.code >= 400 && e.code < 500;
}

function jsonBody(response) {
  return new Promise(function(resolve) {
    if (response[0].statusCode < 200 || response[0].statusCode >= 400) {
      throw new Error("Received status code: " + response[0].statusCode);
    }

    resolve(JSON.parse(response[1]));
  });
}

function sendError(res, json) {
  return function(e) {
    var body = json ? {error: e.message} : e.message;
    res.status(500).send(body);
  };
}

mongoose.connect(config.mongodb_url);

var contentItemSchema = mongoose.Schema({
  youtube_id: String,
  soundcloud_id: String,
  title: String,
  description: String,
  deleted: Boolean,
  type: String
});

var userSchema = mongoose.Schema({
  _id: String, // Will be the user ID from Twitter

  // Twitter creds unused for now, probably will remain so
  twitter_token: String,
  twitter_token_secret: String,

  user_name: String,
  display_name: String,
  photo_uri: String,
  admin: Boolean
});

var ContentItem = mongoose.model('content_item', contentItemSchema);
var User = mongoose.model('user', userSchema);

// Promisify models
[User, ContentItem].forEach(function(model) {
  Promise.promisifyAll(model);
  Promise.promisifyAll(model.prototype);
});

function renderItem(item) {
  return {
    id: item._id,
    youtube_id: item.youtube_id,
    title: item.title,
    description: item.description
  };
}

var app = express();

app.use(morgan('common'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.use(express.static('build'));

// Might want to think more about the values for resave and saveUninitialized
app.use(session({
  secret: config.session_secret,
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

var handlebars = expressHandlebars.create({
  helpers: {
    json: function(obj) {
      return JSON.stringify(obj);
    }
  }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

passport.use(new TwitterStrategy({
    consumerKey: config.twitter_key,
    consumerSecret: config.twitter_secret,
    callbackURL: config.site_prefix + "/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    User.findOneAsync({_id: profile.id}).then(function(existingUser) {
      if (existingUser) {
        return existingUser;
      } else {
        var newUser = new User({
          _id: profile.id,
          twitter_token: token,
          twitter_token_secret: tokenSecret,
          user_name: profile.username,
          display_name: profile.displayName,
          photo_uri: (profile.photos[0] && profile.photos[0].value),
          admin: false
        });
        return newUser.saveAsync().then(function() { return newUser; });
      }
    }).nodeify(done);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOneAsync({_id: id}).then(function(user) {
    if (user) {
      return user;
    } else {
      throw new Error("User not found: " + id);
    }
  }).nodeify(done);
});

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.respondWith = function(promise) {
    promise.then(
      function() {
        res.send.apply(res, arguments);
      },
      function(e) {
        res.status(500).send(e.message);
      }
    );
  };

  res.respondWithJson = function(promise) {
    promise.then(
      function() {
        res.send.apply(res, arguments);
      },
      function(e) {
        res.status(500).send({error: true, message: e.message});
      }
    );
  };

  next();
});

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/?login_failure=true'
  }));

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/', function(req, res) {
  ContentItem.findAsync({}, null, {sort: {_id: -1}, limit: 10}).then(function(items) {
    var params = {
      contentItems: _.map(items, renderItem),
      loginUser: (req.user || null)
    };
    res.render('default', {params: params});
  }).caught(sendError(res));
});

app.post('/item/add', function(req, res) {
  var newItem = new ContentItem({
    youtube_id: req.body.youtube_id,
    title: req.body.title,
    description: req.body.description,
    type: 'youtube'
  });
  newItem.saveAsync().then(function() {
    res.send(renderItem(newItem));
  }).caught(sendError(res, true));
});

app.post('/item/remove', function(req, res) {
  ContentItem.removeAsync({_id: req.body.id}).then(function() {
    res.send({});
  }).caught(sendError(res));
});

app.get('/soundcloud/search', function(req, res) {
  var targetUrl = url.format({
    protocol: 'https',
    hostname: 'api.soundcloud.com',
    pathname: '/tracks',
    query: {
      client_id: config.soundcloud_id,
      q: req.query.q
    }
  });

  var jsonP = request(targetUrl).then(function(response) {
    // SoundCloud returns an un-wrapped array, which doesn't parse as JSON off-the-bat.
    var wrappedBody = util.format('{"result": %s}', response[1]);
    try {
      var result = JSON.parse(wrappedBody).result;
    } catch (e) {
      throw new Error("Failed to parse response from SoundCloud: " + e.message);
    }

    return {
      items: _.map(result, function(item) {
        return {
          waveformUrl: item.waveform_url,
          userName: (item.user && item.user.username),
          userUrl: (item.user && item.user.permalink_url),
          id: item.id,
          url: item.permalink_url,
          title: item.title
        };
      })
    };
  });

  res.respondWithJson(jsonP);
});

app.get('/youtube/search', function(req, res) {
  var targetUrl = url.format({
   protocol: 'https',
    hostname: 'content.googleapis.com',
    pathname: '/youtube/v3/search',
    query: {
      part: 'snippet',
      maxResults: 10,
      q: req.query.q,
      key: config.youtube_api_key
    } 
  });
  request(targetUrl).then(jsonBody).then(function(result) {
    res.send({
      items: _.map(result.items, function(item) {
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt
        };
      })
    });
  }).caught(sendError(res, true));
});

var PORT = process.env['PORT'] || config.port;
app.listen(PORT, function() {
  util.log("Listening on port " + PORT);
});


