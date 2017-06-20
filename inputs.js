var mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URI || 'mongodb://alexkodak:pcJ-z39nqLBg@ds111461.mlab.com:11461/guidebot';

mongoose.connect(mongoDB);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});


var InputSchema = mongoose.Schema({
	user_id: String,
	tour: Number,
	language: String,
	tour_description: String,
	caption: Number,
	room: Number,
	caption_description: String
});



exports.findbyId = function(req, res) {
	var Inputs = mongoose.model('Inputs', InputSchema);
        var id = req.params.user
        console.log("Looking for user: "+ id);
	Inputs.findOne({ user_id: id }, { tour: 1 }, function(err, item) {
            res.send(item);
        });

};