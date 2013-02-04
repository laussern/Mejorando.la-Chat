var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Message = mongoose.model('Message'),
    Feedback = mongoose.model('Feedback');

exports.index = function (req, res, next) {
    var mentions = [];

    if(req.user) {
        mentions = Message.find({ activado: true, content: new RegExp('@'+req.user.username, 'i') }, null, { sort: { datetime: -1}, limit: 25 }).populate('user');
    }

    res.render('website/index', {
        user: req.user,
        messages: Message
            .find({ activado: true }, null, { sort: { datetime: -1 }, limit: 25 })
            .populate('user'),
        mentions: mentions,
        users: User.find({}, null, { sort: { online: -1 }, limit: 10})
    });
};

exports.feedback = function (req, res, next) {
    if(req.user) {
        var f = new Feedback({
            questions: req.param('question', []),
            comment: req.param('comment', null),
            public: req.param('public', false),
            user: req.user
        });

        f.save(function () {});

        if(req.xhr) {
            res.send('OK');
        } else {
            res.redirect('/');
        }
    } else {
        if(req.xhr) {
            res.send('ERR');
        } else {
            res.redirect('/');
        }
    }
};

exports.salir = function (req, res) {
    req.logout();
    res.redirect('/');
};

exports.notFound = function (req, res) {
    res.status(404).render('website/404.jade');
};