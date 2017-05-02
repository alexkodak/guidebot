var config = {
	expressPort: 5000,
	client: {
		mongodb: {
			defaultDatabase: "guidebot",
			defaultCollection: "guidebot",
			defaultUri: "mongodb://alexkodak:pcJ-z39nqLBg@ds111461.mlab.com:11461/guidebot"
		},
		mockarooUrl: ""
	},
	makerMongoDBURI: "mongodb://alexkodak:pcJ-z39nqLBg@ds111461.mlab.com:11461/guidebot/maker?authSource=admin",
	checkinCollection: "guidebot"
};

module.exports = config;
