/*
Defines and implements the guidebot Restful API by adding 'get' and 'post'
routes to the router.
*/

var request = require("request");
var express = require('express');
var router 	= express.Router();

var config = require('../config.js');
var DB = require('../javascripts/db');



router.get('/', function(req, res, next) {

    // This isn't part of API and is just used from a browser or curl to test that
    // "/tour" is being routed correctly.

    var testObject = {
        "AppName": "guidebot",
        "Version": 1.0
    }
    res.json(testObject);
});

router.get('/config', function(req, res, next) {
    res.json(config.client);
})