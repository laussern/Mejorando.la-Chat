var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  avatar: String,
  link: String,
  red: String,
  redId: String,
  token: String,
  tokenSecret: String,
  pais: String,
  ip: String,
  activado: { type: Boolean, 'default': true },
  admin: { type: Boolean, 'default': false }
});

userSchema.statics.findOrCreate = function (profile, done) {
  this.findOne({ redId: profile.redId }, function (err, user) {
    if(err) return done(err);

    if(user) return done(null, user);

    user = new User(profile);
    user.save(done);
  });
};

var User = mongoose.model('User', userSchema);