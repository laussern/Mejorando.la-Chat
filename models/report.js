var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var reportSchema = new Schema({
    connectedSockets             : Number,
    messagesBroadcastedPerMinute : Number,
    cpuLoad                      : Number,
    datetime                     : { type: Date, 'default': Date.now },
    loadPerProcess               : Schema.Types.Mixed
});

mongoose.model('Report', reportSchema);