var mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI);

var Input = mongoose.model ('Input', InputSchema);

var InputSchema = new mongoose.Schema({
  user_id: {type: String},
  tour: {type: String}
});

module.exports = mongoose.model('Input', InputSchema);