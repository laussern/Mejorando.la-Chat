var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    User = mongoose.model('User');

exports.index = function (req, res, next) {
  if(req.user && req.user.admin) {
    res.send('admin');
  } else {
    res.redirect('/');
  }
  
/*    invoke(function (data, callback) {
      Message.count(callback);
    })
    .and(function (data, callback) {
      Message.countDesactivados(callback);
    })
    .and(function (data, callback) {
      Message.countPublished(callback);
    })
    // datos de usuarios
    .and(function (data, callback) {
      User.count(callback);
    })
    .and(function (data, callback) {
      User.find(callback);
    }).and(function (data, callback) {
      User.countDesactivados(callback);
    }).and(function (data, callback) {
      User.countTwitter(callback);
    })
    .and(function (data, callback) {
      User.countFacebook(callback);
    })
    .end(null, function (data) {
      res.render('admin', { mensajes: {
        total: data[0],
        desactivados: data[1],
        publicados: data[2]
      }, usuarios: {
        total: data[3],
        all: data[4],
        desactivados: data[5],
        twitter: data[6],
        facebook: data[7]
      }});
    });*/
};