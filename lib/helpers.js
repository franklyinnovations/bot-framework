"use strict";
var nlp = require('nlp_compromise');
function grabTopics(text) {
    var nlpProcessed = nlp.text(text);
    return Promise.resolve({
        action: null,
        details: {
            people: nlpProcessed.people(),
            places: nlpProcessed.places(),
        }
    });
}
exports.grabTopics = grabTopics;
