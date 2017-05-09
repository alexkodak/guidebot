var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var InputSchema = new Schema({
  user_id: {type: String},
  tour: {type: String}
});

module.exports = mongoose.model("Input", InputSchema);