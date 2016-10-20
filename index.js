var alexa = require('alexa-app');
var pizzapi = require('dominos');

var app = new alexa.app('Pizza');

app.launch(function(request,response) {
    // Do nothing on launch
    // In the future we can retrieve state here
	return false;
});

app.intent('TestIntent', {},
    function (request, response) {
        response.say("Hello team pizza.");
    }
);

app.intent('TheUsual', {},
    function (request, response) {
        response.say("Your usual pizza, coming right up");
    }
);

// Export a handler function for Lambda to work with
exports.handler = app.lambda();