/* Importa mongoose para manejo de base de datos mongodb */
var mongoose = require('mongoose');

/* Recoje el feedback */
var feedbackSchema = new mongoose.Schema({
  comment: String,
  questions: [{ content: String, answer: Boolean }],
  datetime: { type: Date, 'default': Date.now },
  public: { type: Boolean, 'default': false },
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
});
/* Guarda feedbackSchema en mongodb */
mongoose.model('Feedback', feedbackSchema);
