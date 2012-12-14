var cookie = require('cookie'),
    parseCookie = require('connect').utils.parseSignedCookie,
    // Redis
    RedisStore = require('socket.io/lib/stores/redis'),
    redis = require('socket.io/node_modules/redis');

module.exports = function (config, server, sessionStore) {
  /*
   * Socket.io configuration
   */
  var io = require('socket.io').listen(server),
    pub = redis.createClient(),
    sub = redis.createClient(),
    client = redis.createClient();

  io.configure(function () {
    io.set('static', new (require('socket.io').Static)(io));

    io.set('store', new RedisStore({
      redisPub: pub,
      redisSub: sub,
      redisClient: client
    }));

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
  });

  io.configure('production', function () {
    io.set('log level', 0);

    io.enable('browser client minification'); // send minified client
    io.enable('browser client etag');         // apply etag caching logic based on version number
    io.enable('browser client gzip');       // gzip the file

    io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
  });

  io.configure('development', function () {
    io.set('transports', ['websocket']);
  });

  require('./controllers/io')(io);
};