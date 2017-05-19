var mongoose = require("mongoose");

var InputSchema = mongoose.Schema({
	user_id: String,
	tour: String,
	language: String,
	Description: String
});

module.exports = mongoose.model("Input", InputSchema);