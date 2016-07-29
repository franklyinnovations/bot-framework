"use strict";
var natural = require('natural');
var _ = require('lodash');
var fs = require('fs');
exports.classifier = natural.LogisticRegressionClassifier;
// export const classifier = natural.BayesClassifier;
function GenerateClassifier(topicsToLoad) {
    var topics = topicsToLoad.filter(function (element) { return typeof element !== 'string'; });
    topicsToLoad.filter(function (directory) { return typeof directory === 'string'; }).forEach(function (directory) { return fs.readdirSync(directory).forEach(function (topic) {
        topics.push(readInTopic(topic, directory + "/" + topic));
    }); });
    // console.log('t:', util.inspect(topics, {depth:null}));
    var topicPhrases = topics.map(function (topic) { return _.flatten(topic.actions.map(function (action) { return action.phrases; })); });
    var allPhrases = _.chain(topicPhrases).flatten().flatten().value();
    // console.log('ap:', util.inspect(allPhrases, {depth:null}));
    var classifiers = {};
    topics.forEach(function (topic) {
        classifiers[topic.topic] = GenerateTopicClassifier(topic, allPhrases);
    });
    // console.log(classifiers);
    return classifiers;
}
exports.GenerateClassifier = GenerateClassifier;
function readInTopic(topic, directory) {
    // console.log('dir', directory);
    var actions = [];
    fs.readdirSync(directory).forEach(function (file) {
        var key = /(.*).json/.exec(file);
        // console.log(`loading '${key[1]}'`);
        try {
            var phrases = require(directory + "/" + file);
            actions.push({ action: key[1], phrases: phrases });
        }
        catch (err) {
            throw new Error("Invalid JSON file " + directory + "/" + file);
        }
    });
    return {
        topic: topic,
        actions: actions,
    };
}
function GenerateTopicClassifier(topic, allPhrases) {
    var classifiers = {};
    topic.actions.forEach(function (action) {
        var phrases = action.phrases;
        var key = action.action;
        var thisClassifier = new exports.classifier();
        var otherPhrases = _.difference(allPhrases, phrases);
        // console.log(value);
        phrases.forEach(function (phrase) { return thisClassifier.addDocument(phrase, 'true'); });
        otherPhrases.forEach(function (phrase) { return thisClassifier.addDocument(phrase, 'false'); });
        thisClassifier.train();
        // console.log(`--${key}--`);
        //
        // const othersChecked = otherPhrases.map(phrase => thisClassifier.classify(phrase)).map((classified, index) => {
        //   if (classified === 'true') {
        //     // console.log('other', index, otherPhrases[index], thisClassifier.getClassifications(otherPhrases[index]));
        //     return otherPhrases[index];
        //   }
        //   return null;
        // });
        //
        // const selfChecked = phrases.map(phrase => thisClassifier.classify(phrase)).map((classified, index) => {
        //   if (classified === 'false') {
        //     // console.log('self', index, value[index], thisClassifier.getClassifications(value[index]));
        //     return phrases[index];
        //   }
        //   // console.log(value[index], thisClassifier.getClassifications(value[index]));
        //   return null;
        // });
        // console.log('other:', otherPhrases.length, '  self:', value.length);
        // console.log('passed for other', _.compact(othersChecked));
        // console.log('failed for home', _.compact(selfChecked));
        classifiers[key] = thisClassifier;
    });
    return classifiers;
}
exports.GenerateTopicClassifier = GenerateTopicClassifier;
