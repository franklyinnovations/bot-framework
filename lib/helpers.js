"use strict";
var nlp = require('nlp_compromise');
function grabTopics(text) {
    var nlpProcessed = nlp.text(text);
    // console.log('nlpProcessed', nlpProcessed);
    return Promise.resolve({
        action: null,
        details: {
            dates: nlpProcessed.dates(),
            people: nlpProcessed.people(),
            value: nlp.value(text).number,
        },
        topic: 'details',
    });
}
exports.grabTopics = grabTopics;
