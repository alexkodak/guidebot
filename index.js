var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var db = mongoose.connect(process.env.MONGODB_URI);
var Input = require("./models/input");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page - deprecated as test now located in Rest API
app.get("/", function (req, res) {
  res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        } else if (event.message) {
          processMessage(event);
        }
      });
    });

    res.sendStatus(200);
  }
});


function processPostback(event) {
	var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + "My name is Guy the Guide. Can you give me the Tour ID of the place you are visiting today?";
      sendMessage(senderId, {text: message});
    });
  }else if (payload === "Correct") {
        sendMessage(senderId, {text: "Awesome!"});
    } else if (payload === "Incorrect") {
        sendMessage(senderId, {text: "Oops! Sorry about that."});
    }
}


function processMessage(event) {
  if (!event.message.is_echo) {
    var message = event.message;
    var senderId = event.sender.id;

    console.log("Received message from senderId: " + senderId);
    console.log("Message is: " + JSON.stringify(message));

    // You may get a text or attachment but not both
    if (message.text) {
     var formattedMsg = message.text.toLowerCase().trim();
		
      // If we receive a text message, check to see if it matches any special
      // keywords and send back the corresponding movie detail.
      // Otherwise, search for new movie.
		switch (formattedMsg) {
	  case "tour":
	  case "language":
	  case "description":
	  getTourDetail(senderId, formattedMsg);
			break;
        default:
		  findTour(senderId, formattedMsg);
		  sendMessage(senderId, {text: "Okay boss." + senderId});
      }
    } else if (message.attachments) {
      sendMessage(senderId, {text: "Sorry, I don't understand your request."});
    }
  }
}

// look for tour details

function findTour(userId, formattedMsg) {
	   request("https://blooming-wave-81088.herokuapp.com/tours/" + formattedMsg, function (error, response, body) {
        if (!error && response.statusCode == 200) {
			console.log("connection ok" + body);
			console.log("userId is:" + userId);
	
			
			var inputObj = JSON.parse(body);
			res.inputObj(inputObj.Response);
			console.log("tour is:" + inputObj.tour);
			console.log("language is:" + inputObj.language);
			console.log("description is:" + inputObj.description);
			console.log("inputObj is:" + inputObj);
	
			if (inputObj.Response === "True") {
               	var query = {user_id: userId};
                var update = {
                   user_id: userId,
                    tour: inputObj.tour,
                    language: inputObj.language,
                    description: inputsObj.description,
                };
                var options = {upsert: true};
				console.log("inputObj is true");
				console.log("query is:" + query);
				console.log("update is:" + update);
              				Input.findOneAndUpdate(query, update, options, function(err, Input) {
				  if (err) {
                        console.log("Database error: " + err);
                    } else {
                        message = {
                            attachment: {
                                type: "template",
                                payload: {
                                    template_type: "generic",
                                    elements: [{
                                        title: inputObj.tour,
                                        subtitle: "Is this the tour are looking for?",
                                        buttons: [{
                                            type: "postback",
                                            title: "Yes",
                                            payload: "Correct"
                                        }, {
                                            type: "postback",
                                            title: "No",
                                            payload: "Incorrect"
                                        }]
                                    }]
                                }
                            }
                        };
                        sendMessage(userId, message);
                    }
                });
            } else {
                console.log(inputObj.Error);
                sendMessage(userId, {text: inputObj.Error});
            }
        } else {
            sendMessage(userId, {text: "Something went wrong. Try again."});
        }
    });
}


function getTourDetail(userId, field) {
  Input.findOne({user_id: userId}, function(err, tour) {
    if(err) {
      sendMessage(userId, {text: "Something went wrong. Try again"});
    } else {
      sendMessage(userId, {text: tour[field]});
    }
  });
}


// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}