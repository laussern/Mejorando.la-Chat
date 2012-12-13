var mongoose = require('mongoose'),
    User = mongoose.model('User');

exports.twitter = function(token, tokenSecret, profile, done) {
  User.findOrCreate({
    username: profile.username,
    avatar: profile._json.profile_image_url_https,
    link: 'http://twitter.com/' + profile.username,
    red: 'twitter',
    redId: profile._json.id_str,
    token: token,
    tokenSecret: tokenSecret
  }, done);
};

exports.facebook = function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({
    username: profile.username,
    avatar: 'https://graph.facebook.com/'+profile.username+'/picture',
    link: profile.profileUrl,
    red: 'facebook',
    redId: profile.id,
    token: accessToken,
    tokenSecret: refreshToken
  }, done);
};

exports.user = function(id, done) {
  User.findById(id, done);
};