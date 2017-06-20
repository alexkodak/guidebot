var mongoose = require("mongoose");

var InputSchema = mongoose.Schema({
	user_id: String,
	tour: Number,
	language: String,
	tour_description: String,
	caption: String,
	room: Number,
	caption_description: String
});

module.exports = mongoose.model("Input", InputSchema);