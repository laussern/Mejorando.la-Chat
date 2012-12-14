var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    User = mongoose.model('User');

exports.index = function (req, res, next) {
  if(req.user && req.user.admin) {
    User.aggregate(
      { $match: {pais: { $ne: null}} },
      { $group: { _id: "$pais", count: { $sum: 1}  }},
      function (err, data) {
          if(err) next(err);

          res.render('admin/index', {
            mensajes_total: Message.count(),
            mensajes_desactivados: Message.count({ activado: false }),
            mensajes_publicados: Message.count({ publish: true }),

            usuarios_total: User.count(),
            usuarios_bloqueados: User.count({ activado: false }),
            usuarios_facebook: User.count({ red: 'facebook'}),
            usuarios_twitter: User.count({ red: 'twitter' }),
            usuarios_all: User.find(),
            usuarios_geo: data
          });
    });

  } else {
    res.redirect('/');
  }
};

exports.update = function (req, res, next) {
  if(req.user && req.user.admin) {
    var id = req.param('id', null),
      activado = req.param('activado', null),
      admin = req.param('admin', null);

      if(id && activado && admin) {
        activado = activado == 'true';
        admin = admin == 'true';

        User.update({ _id: id}, { $set: { activado: activado, admin: admin }}).exec();
      }

      res.send('OK');
  } else {
    res.redirect('/');
  }
}