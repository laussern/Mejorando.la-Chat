var mongoose = require('mongoose'),
    Message = mongoose.model('Message'),
    Feedback = mongoose.model('Feedback'),
    Report = mongoose.model('Report'),
    User = mongoose.model('User');

exports.index = function (req, res, next) {
  res.render('admin/index');
};

exports.feedback = function (req, res, next) {
  Feedback.mapReduce({
    map: function () { emit(this.datetime.getFullYear() + '-' + (this.datetime.getMonth() + 1) + '-' + this.datetime.getDate(), 1); },
    reduce: function (k, vals) { return vals.length; }
  }, function (err, dates) {
    if(err) next(err);

    res.render('admin/feedback', {
      dates: dates
    });
  });
};

exports.feedback_single = function (req, res, next) {
  var parts = req.params.date.split('-');

  if(parts.length != 3) return next('No son suficientes parametros');

  var year, month, day, start, end;

  year = parseInt(parts[0], 10);
  month = parseInt(parts[1], 10) - 1 ;
  day = parseInt(parts[2], 10);

  start = new Date(year, month, day);
  end = new Date(year, month, day + 1);

  Feedback.aggregate({
    $unwind: "$questions"
  }, {
    $match: {
      "questions.content": "¿Te gustó el programa?",
      "datetime": { $gt: start, $lt: end}
    }
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

    res.render('admin/feedback_single', {
      comments: Feedback.find({ "comment": {$ne: "" }, "datetime": { $gte: start, $lt: end} }, null, { sort: { datetime: -1 }}).populate('user'),
      likes: likes,
      dislikes: dislikes
    });
  });
};

exports.users = function (req, res, next) {
  User.aggregate(
    { $match: {pais: { $ne: null}, online: true } },
    { $group: { _id: "$pais", count: { $sum: 1}  }},
    function (err, data) {
        if(err) next(err);

        res.render('admin/users', {
          users: User.find({ online: true }),
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

exports.socketReport = function(req, res, next) {
  Report.find()
   .limit(60)
   .sort('-datetime')
  .exec(function(err, reports){
    res.render('admin/socketReport', {
      sockets: reports
    });    
  });
}