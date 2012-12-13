var mongoose = require('mongoose');

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

mongoose.model('Message', messageSchema);