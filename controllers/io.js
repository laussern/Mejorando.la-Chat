var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    User = mongoose.model('User');

function getUserFromHS(hs, callback) {
  if(hs.session && hs.session.passport.user) {
      User.findById(hs.session.passport.user, callback);
  } else {
    callback(null, null);
  }
}

module.exports = function (io) {
  io.sockets.on('connection', function (socket) {
    var hs = socket.handshake;

    socket.on('send message', function (message) {
        getUserFromHS(hs, function (err, user) {
          if(err) return err;

          if(user && user.activado) {
             message = new Message({
              content: message.content,
              publish: message.publish,
              user: user,
              ip: hs.address
            });

            // guardar el mensaje
            message.save(function (err, message) {
              if(err) return err;

              var msg = {
                id: message.id,
                content: message.content,
                datetime: message.datetime,
                user: {
                  username: user.username,
                  avatar: user.avatar,
                  link: user.link,
                  staff: user.admin
                }
              };

              socket.emit('message sent', msg);
              socket.broadcast.emit('send message', msg);
            });
          }
        });
    });

    socket.on('delete message', function (id) {
      getUserFromHS(hs, function (err, user) {
        if(err) return err;

        if(user && user.admin) {
          Message
            .findById(id)
            .populate('user')
            .exec(function (err, message) {
                if(err) return err;

                if(!message) return;

                message.update({ $set: { activado: false }}, function (err) {
                    if(err) return err;

                    socket.broadcast.emit('message deleted', id);
                });

                // no bloquear a un administrador o a un usuario ya buscado
                if(!message.user.admin && message.user.activado) {
                    Message.countDeletedByUser(message.user, function (err, count) {
                        if(err) return err;

                        if(count > 3) {
                            message.user.update({ $set: { activado: false }}, function (err) {
                                if(err) return err;
                            });
                        }
                    });
                }
            });
        }
      });
    });
    
    socket.on('push encuesta', function (questions) {
      getUserFromHS(hs, function (err, user) {
        if(err) return err;

        if(user && user.admin) {
          io.sockets.emit('encuesta', questions);
        }
      });
    });

    socket.on('disconnect', function () {
      getUserFromHS(hs, function (err, user) {
        if(err) return err;

        if(user) {
          user.update({ $set: { online: false }}, function () {});
        }
      });
    });

    getUserFromHS(hs, function (err, user) {
      if(err) return err;

      if(user) {
        user.update({ $set: { online: true }}, function () {} );
      }
    });
  });
};