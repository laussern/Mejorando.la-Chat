var mongoose = require('mongoose');

var feedbackSchema = new mongoose.Schema({
  comment: String,
  questions: [{ content: String, answer: Boolean }],
  datetime: { type: Date, 'default': Date.now },
  public: { type: Boolean, 'default': false },
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
});

mongoose.model('Feedback', feedbackSchema);