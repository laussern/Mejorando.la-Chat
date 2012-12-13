
/**
 * Module dependencies.
 */

var express = require('express'),
    cookie = require('cookie'),
    fs = require('fs'),
    parseCookie = require('connect').utils.parseSignedCookie,
    request = require('request'),
    // configurations
    config = require('./config'),
    // database
    mongoose = require('mongoose'),
    // authentication
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy;

require('express-mongoose');
require('datejs');

/**
 * Database configuration
 */
mongoose.connect('mongodb://localhost/' + config.db.name );

// modelos
require('./models/User');
require('./models/Message');

/**
 * Auth configuration
 */
var auth = require('./auth'),
  sche = config.secure ? 'https' : 'http';

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: sche+"://"+config.host+":"+config.port+"/auth/twitter/callback"
  }, auth.twitter));

passport.use(new FacebookStrategy({
    clientID: config.facebook.appId,
    clientSecret: config.facebook.appSecret,
    callbackURL: sche+"://"+config.host+":"+config.port+"/auth/facebook/callback"
  }, auth.facebook));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(auth.user);

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

  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));

  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.cookie.secret));
  app.use(express.session({secret: config.session.secret, key: config.session.key, store: sessionStore }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(function (req, res, next) {
    if(req.user && !req.user.ip) {
      request({ url: 'https://mejorando.la/locateme', headers: { 'X-Real-IP': req.ip } },
        function (err, response, body) {
          if(err) return next();


          req.user.ip = req.ip;
          req.user.pais = body;

          req.user.save();

          next();
      });
    } else {
      next();
    }
  });

  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 * Server configuration
 */
var server = config.secure ? require('https').createServer({key: fs.readFileSync(settings.key).toString(),
        cert: fs.readFileSync(settings.cert).toString()}, app) : require('http').createServer(app);

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

require('./controllers/io')(io);

/*
 * Routes
 */
require('./routes')(app, passport);

/*
 * Bootstrap
 */
server.listen(config.port, function(){
  console.log("Mejorando.la Chat server listening on port " + app.get('port'));
});
