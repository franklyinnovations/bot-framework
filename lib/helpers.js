"use strict";
var nlp = require('nlp_compromise');
function grabTopics(text) {
    var nlpProcessed = nlp.text(text);
    // console.log('nlpProcessed', nlpProcessed);
    return Promise.resolve({
        action: null,
        topic: 'details',
        details: {
            people: nlpProcessed.people(),
            dates: nlpProcessed.dates(),
            value: nlp.value(text).number,
        }
    });
}
exports.grabTopics = grabTopics;
