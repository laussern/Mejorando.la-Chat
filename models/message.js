var mongoose = require('mongoose'),
    config = require('../config'),
    request = require('request'),
    qs = require('querystring');
/* Recoje datos del mensaje para un schema en mongoose
Contenido, fecha, publicacion. publicacion redes sociales, ip y usuario */
var messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  datetime: { type: Date, 'default': Date.now },
  publish: { type: Boolean, 'default': false },
  activado: { type: Boolean, 'default': true },
  ip: String,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
});


messageSchema.statics.countDeletedByUser = function (user, done) {
    this.count({ activado: false, user: user }, done);
};


messageSchema.methods.get_content = function (user) {
    var text = this.content;

    // Ataques
    text = text.replace(/&(?!\s)|</g, function (s) { if(s == '&') return '&amp;'; else return '&lt;'; });
    // links
    text = text.replace(/https?:\/\/(\S+)/, '');
    // emoticons
    text = text.replace(/(:\)|:8|:D|:\(|:O|:P|:cool:|:'\(|:\|)/g, '<span title="$1" class="emoticon"></span>');
        /* En caso de una mencion */
    if(user) {
        text = text
                .replace('@'+user.username, '<span class="mention">@'+user.username+'</span>');
    }

    return text;
};
/* post del mensaje */
messageSchema.post('save', function (message) {
    if(message.publish) {
        /* en un modelo de mongoose guarda el usuario que lo envio */
        var User = mongoose.model('User');
        /* Autenticacion de usuario */
        User.findById(message.user, function (err, user) {
            if(!err && user) {
                /* Confirma autenticacion tanto en facebook como en twitter */
                if(user.red == 'twitter') {
                    request.post({
                        url: 'https://api.twitter.com/1/statuses/update.json',
                        oauth: {
                            consumer_key: config.twitter.consumerKey,
                            consumer_secret: config.twitter.consumerSecret,
                            token: user.token,
                            token_secret: user.tokenSecret
                        },
                        form: {
                            status: message.content + ' http://mejorando.la'
                    }});
                } else if(user.red == 'facebook') {
                    request.post('https://graph.facebook.com/'+user.redId+'/feed?access_token='+user.token,
                        {form: { message: message.content + ' http://mejorando.la'}});
                }
            }
        });
    }
});
/* Guarda el mensaje */
mongoose.model('Message', messageSchema);