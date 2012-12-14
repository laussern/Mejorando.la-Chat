var mongoose = require('mongoose'),
    Message = mongoose.model('Message');

exports.index = function (req, res, next) {
    res.render('website/index', {
        user: req.user,
        messages: Message
            .find({ activado: true }, null, { sort: { datetime: -1 }, limit: 25 })
            .populate('user')
    });
};

exports.salir = function (req, res) {
    req.logout();
    res.redirect('/');
};

exports.notFound = function (req, res) {
    res.status(404).render('website/404.jade');
};