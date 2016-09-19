"use strict";
var nlp = require('nlp_compromise');
var _ = require('lodash');
var classifier_1 = require('./classifier');
var locationClassifiers = classifier_1.GenerateClassifier([(__dirname + "/../nlp/locations")]);
function grabTopics(text) {
    var nlpProcessed = nlp.text(text);
    // console.log('nlpProcessed', nlpProcessed);
    var compacted = classifier_1.runThroughClassifiers(text, locationClassifiers);
    var grouped = _.groupBy(compacted, 'topic');
    var intent = {
        action: null,
        details: {
            dates: nlpProcessed.dates(),
            people: nlpProcessed.people(),
            value: nlp.value(text).number,
            locations: _.mapValues(grouped, function (classifications) { return classifications.map(function (classification) { return _.startCase(classification.label); }); }),
        },
        topic: 'details',
    };
    // if (this && this.debugOn) { console.log('details intent', util.inspect(intent, { depth: null })); };
    return Promise.resolve(intent);
}
exports.grabTopics = grabTopics;
