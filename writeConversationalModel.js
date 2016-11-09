var app = require('./index');
var fs = require('fs');

fs.writeFile("schema.txt", app.schema, function (err) {
    if (err) {
        return console.log(err);
    } else {
        console.log("Schema saved to schema.txt!");
    }
});

fs.writeFile("utterances.txt", app.utterances, function (err) {
    if (err) {
        return console.log(err);
    } else {
        console.log("Utterance saved to utterances.txt!");
    }
});