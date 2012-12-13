var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    User = mongoose.model('User');

exports.index = function (req, res, next) {
  if(req.user && req.user.admin) {
    res.render('admin/index', {
      mensajes_total: Message.count(),
      mensajes_desactivados: Message.count({ activados: false }),
      mensajes_publicados: Message.count({ publish: true }),

      usuarios_total: User.count(),
      usuarios_bloqueados: User.count({ activado: false }),
      usuarios_facebook: User.count({ red: 'facebook '}),
      usuarios_twitter: User.count({ red: 'twitter' }),
      usuarios_all: User.find()
    });
  } else {
    res.redirect('/');
  }
};