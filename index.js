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
        req.body.entry.forEach(function (entry) {
            // Iterate over each messaging event
            entry.messaging.forEach(function (event) {
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
        }, function (error, response, body) {
            var greeting = "";
            if (error) {
                console.log("Error getting user's name: " + error);
            } else {
                var bodyObj = JSON.parse(body);
                name = bodyObj.first_name;
                greeting = "Hi " + name + ". ";
            }
            var message = greeting + "My name is Guy the Guide. Can you give me the Tour ID of the place you are visiting today?";
            sendMessage(senderId, {text: message});
        });
    } else if (payload === "Correct") {
        sendMessage(senderId, {text: "Great, now let's look at the caption you want to read."});

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


// If we receive a text message, check to see if we already now this user

                if(formattedMsg.length === 8) {
                findTour(senderId, formattedMsg);
                sendMessage(senderId, {text: "Okay, we are looking for tour: " + formattedMsg});


                              }
                else {
                updateCaption(senderId, formattedMsg), function(err, findCaption){
                    if(err){
                        console.log("Can't update caption");
                    }
                    else {
                        console.log("Caption was updated");
                      }
                    };
            }
                }


    else if (message.attachments) {
            sendMessage(senderId, {text: "Sorry, I don't understand your request."});
        }
    }
      }


// look for tour details

function findTour(userId, formattedMsg) {
    request("https://blooming-wave-81088.herokuapp.com/tours/" + formattedMsg, function (error, response, body, res) {
        if (!error && response.statusCode == 200) {

            console.log("connection ok, looking for tour" + body);

            var inputObj = JSON.parse(body);

            console.log("tour is:" + inputObj.tour);
            console.log("language is:" + inputObj.language);
            console.log("description is:" + inputObj.description);

            if(inputObj.hasOwnProperty('tour')) {
                var query = {user_id: userId};
                var update = {
                    user_id: userId,
                    tour: inputObj.tour,
                    language: inputObj.language,
                    tour_description: inputObj.description
                };
                var options = {upsert: true};
                console.log("valid tour requested");

                Input.findOneAndUpdate(query, update, options, function (err, Input) {
                    if (err) {
                        console.log("Database error: " + err);
                    } else {
                        message = {
                            attachment: {
                                type: "template",
                                payload: {
                                    template_type: "generic",
                                    elements: [{
                                            title: inputObj.description + " - " + inputObj.language,
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
                        }
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


// capture the caption inputs in Mongo

function updateCaption (senderId, formattedMsg){

 var formattedCaption = formattedMsg;
                console.log("formatted caption is: " + formattedCaption);
                var query = {user_id: senderId};
                var update = {
                    caption: formattedCaption
                  };
                var options = {upsert: true};
                console.log("valid caption requested");

                Input.findOneAndUpdate(query, update, options, function(err) {
                    if (err) {
                        console.log("Database error: " + err);
                    } else {
                        console.log("loading findCaption");

                                   }
              });
          };


// look for caption details

function findCaption(userId, senderId) {
     var query = {user_id: senderId};
    Input.findOne(query, function (err, response) {
                    if (err) {
                        console.log("Database error: " + err);
                    } else {
                  console.log("Last selected tour is: " + Input.tour);
                  console.log("Last selected caption is: " + Input.caption);

                var tour = Input.tour;
                var caption = Input.caption;
    request("https://blooming-wave-81088.herokuapp.com/captions/" + tour + "/" + caption, function (error, body) {
            if (error) {
                console.log("Error getting tour: " + error);
            } else {
           var captionObj = JSON.parse(body);
           console.log("description is:" + captionObj.description);
           sendMessage(userId,{text: captionObj.description});
                       }
      });
         }
              });
 };



// sends message to user
function sendMessage(recipientId, message) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message
        }
    }, function (error, response, body) {
        if (error) {
            console.log("Error sending message: " + response.error);
        } else {
            console.log("message ok");
      }
    });
 }
