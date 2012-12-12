
/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    cookie = require('cookie'),
    parseCookie = require('connect').utils.parseSignedCookie,
    // configurations
    config = require('./config'),
    // database
    mongoose = require('mongoose'),
    // authentication
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy;


require('datejs');

/**
 * Database configuration
 */
var db = mongoose.createConnection('mongodb://localhost/' + config.db.name );

var userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  avatar: String,
  link: String,
  red: String,
  redId: String,
  token: String,
  tokenSecret: String
});

var User = db.model('User', userSchema);

var messageSchema = new mongoose.Schema({
  content: String,
  datetime: { type: Date, default: Date.now },
  publish: { default: false, type: Boolean },
  ip: String,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

var Message = db.model('Message', messageSchema);

var sche = config.secure ? 'https' : 'http';
/**
 * Auth configuration
 */
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: sche+"://"+config.host+":"+config.port+"/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    User.findOne({ redId: profile._json.id_str }, function (err, user) {
      if(err) return done(err);

      if(!user) {
        user = new User({
          username: profile.username,
          avatar: profile._json.profile_image_url_https,
          link: 'http://twitter.com/' + profile.username,
          red: 'twitter',
          redId: profile._json.id_str,
          token: token,
          tokenSecret: tokenSecret
        });
        user.save(done);
      } else {
        done(null, user);
      }
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: config.facebook.appId,
    clientSecret: config.facebook.appSecret,
    callbackURL: sche+"://"+config.host+":"+config.port+"/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ redId: profile.id }, function (err, user) {
      if(err) return done(err);

      if(!user) {
        user = new User({
          username: profile.username,
          avatar: 'https://graph.facebook.com/'+profile.username+'/picture',
          link: profile.profileUrl,
          red: 'facebook',
          redId: profile.id,
          token: accessToken,
          tokenSecret: refreshToken
        });
        user.save(done);
      } else {
        done(null, user);
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, done);
});

/*
 * Session configurations
 */
var sessionStore = new (require('connect-mongo')(express))({ db: config.db.name });

/*
 * Server configuration
 */
var app = express();

app.configure(function(){
  app.set('port', config.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon('public/images/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.cookie.secret));
  app.use(express.session({secret: config.session.secret, key: config.session.key, store: sessionStore }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 * Server configuration
 */
var server = http.createServer(app);

/*
 * Socket.io configuration
 */
var io = require('socket.io').listen(server);

io.configure('production', function () {
  io.set('log level', 1);

  io.enable('browser client minification'); // send minified client
  io.enable('browser client etag');         // apply etag caching logic based on version number
  io.enable('browser client gzip');       // gzip the file

  io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});

io.configure('development', function () {
  io.set('transports', ['websocket']);
});

io.set('authorization', function (data, accept) {
  if(data.headers.cookie) {
    data.cookie = cookie.parse(data.headers.cookie);
    data.sessionID = parseCookie(data.cookie[config.session.key], config.session.secret);

    sessionStore.get(data.sessionID,
      function (err, session) {
        if(err) return accept(err, false);

        data.session = session;

        accept(null, true);
    });
  } else {
    return accept(null, true);
  }
});

io.sockets.on('connection', function (socket) {
  var hs = socket.handshake;
  socket.on('send message', function (message) {
    if(hs.session && hs.session.passport.user) {
        var user_id = hs.session.passport.user;

        User.findById(user_id, function (err, user) {
          if(err) return err;

          message = new Message({
            content: message.content,
            publish: message.publish,
            user: user
          });

          message.save(function (err, message) {

            if(err) return err;

            var msg = {
              content: message.content,
              datetime: message.datetime,
              user: {
                username: user.username,
                avatar: user.avatar,
                link: user.link
              }
            };

            socket.emit('message sent', msg);
            socket.broadcast.emit('send message', msg);
          });
        });
    }
  });
});

/*
 * Routes
 */
app.get('/', function (req, res, next) {
  Message.find(null, null, { sort: { datetime: -1 }, limit: 25 })
    .populate('user')
    .exec(function (err, messages) {
      if(err) return next(err);
      
      res.render('index', { user: req.user, messages: messages });
  });
});

app.get('/salir', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/' }));

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                     failureRedirect: '/' }));

/*
 * Bootstrap
 */
server.listen(config.port, function(){
  console.log("Mejorando.la Chat server listening on port " + app.get('port'));
});
