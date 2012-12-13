var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    User = mongoose.model('User');

exports.index = function (req, res, next) {
  if(req.user && req.user.admin) {
    res.send('admin');
  } else {
    res.redirect('/');
  }
};