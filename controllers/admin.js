var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    Feedback = mongoose.model('Feedback'),
    User = mongoose.model('User');

exports.index = function (req, res, next) {
  res.render('admin/index');
};

exports.feedback = function (req, res, next) {
  Feedback.aggregate({
    $unwind: "$questions"
  }, {
    $match: { "questions.content": "¿Te gustó el programa?"}
  }, {
    $group: {
      _id: "$questions.answer",
      count: { $sum: 1 }
    }
  }, {
    $sort: { _id: -1 }
  }, function (err, r) {
    if(err) next(err);

    var likes = 0, dislikes = 0;
    if(r[0] && r[0]._id) {
      likes = r[0].count;
    }

    if(r[1] && !r[1]._id) {
      dislikes = r[1].count;
    }

    res.render('admin/feedback', {
      comments: Feedback.find({}, null, { sort: { datetime: -1 }}).populate('user'),
      likes: likes,
      dislikes: dislikes
    });
  });
};

exports.users = function (req, res, next) {
  User.aggregate(
    { $match: {pais: { $ne: null}} },
    { $group: { _id: "$pais", count: { $sum: 1}  }},
    function (err, data) {
        if(err) next(err);

        res.render('admin/users', {
          users: User.find(),
          geo: data
        });
  });
};

exports.update = function (req, res, next) {
  var id = req.param('id', null),
    activado = req.param('activado', null),
    admin = req.param('admin', null);

    if(id && activado && admin) {
      activado = activado == 'true';
      admin = admin == 'true';

      User.update({ _id: id}, { $set: { activado: activado, admin: admin }}).exec();
    }

    res.send('OK');
};