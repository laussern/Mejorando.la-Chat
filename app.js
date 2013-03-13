/**
 * Module dependencies.
 */

//Importamos express y require
var express = require('express'),
    request = require('request'),
    //toobusy = require('toobusy'),
    // Database Mongodb
    mongoose = require('mongoose'),
    // Autenticacion Facebook Twitter
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy;
//Mongoose para express
require('express-mongoose');
require('datejs/lib/date-es-ES');

module.exports = function (config) {
  /**
   * Configuracion de la database
   */
  mongoose.connect('mongodb://localhost/' + config.db.name );

  // modelos
  require('./models/user');
  require('./models/message');
  require('./models/feedback');

  /**
   * Inicio Configuracion Auth0
   */
  var auth = require('./auth'),
    sche = config.loginsecure ? 'https' : 'http';

  passport.use(new TwitterStrategy({
      consumerKey: config.twitter.consumerKey,
      consumerSecret: config.twitter.consumerSecret,
      callbackURL: sche+"://"+config.host+"/auth/twitter/callback"
    }, auth.twitter));

  passport.use(new FacebookStrategy({
      clientID: config.facebook.appId,
      clientSecret: config.facebook.appSecret,
      callbackURL: sche+"://"+config.host+"/auth/facebook/callback"
    }, auth.facebook));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(auth.user);
  /**
   * Fin Configuracion Auth0
   */
  /*
   * Configuracion de sesion
   */
  var sessionStore = new (require('connect-mongo')(express))({ db: config.db.name });

  /*
   * Configuracion de la app
   */
  var app = express();

  app.configure(function(){
    app.set('port', config.port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    /*app.use(function (req, res, next) {
      if(toobusy()) res.status(500).sendfile(__dirname+'/views/overload.html');
      else next();
    });*/
    //Directorio estatico y favicon
    app.use(express.static(__dirname + '/public'));
    app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
    //Peticiones POST para Express
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser(config.cookie.secret));
    app.use(express.session({secret: config.session.secret, key: config.session.key, store: sessionStore }));
    //Importamos passport para autenticacion
    app.use(passport.initialize());
    app.use(passport.session());

    //Establece apartir de la ip su localizacion y la guarda en la informacion del usuario
    app.use(function (req, res, next) {
      if(req.user && !req.user.ip) {
        request({ url: 'https://mejorando.la/locateme?ip='+req.ip },
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
    //Importa router de la app
    app.use(app.router);
  });

  app.configure('production', function () {
    app.use(require('raven').middleware.express(config.sentry_dsn));
    app.use(function (err, req, res, next) {
      res.status(500).sendfile(__dirname+'/views/500.html');
    });
  });

  app.configure('development', function(){
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
  });

  /*
   * Routes
   */
  require('./routes')(app, passport);
  // Retorna la app  y los datos de la sesion
  return { app: app, sessionStore: sessionStore };
};
