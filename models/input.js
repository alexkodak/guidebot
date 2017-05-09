var mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI);

var InputSchema = new mongoose.Schema({
  user_id: {type: String},
  tour: {type: String}
});

var Input = mongoose.model ('Input', schema);

// module.exports = mongoose.model('Input', InputSchema);