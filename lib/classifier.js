"use strict";
var natural = require('natural');
var _ = require('lodash');
var util = require('util'); // tslint:disable-line
var fs = require('fs');
function onlyDirectories(name) {
    return !(_.startsWith(name, '.') || _.endsWith(name, '.json'));
}
exports.classifier = natural.LogisticRegressionClassifier;
// export const classifier = natural.BayesClassifier;
function GenerateClassifier(topicsToLoad) {
    var topics = topicsToLoad.filter(function (element) { return typeof element !== 'string'; });
    var classifiers = {};
    topicsToLoad.filter(function (directory) { return typeof directory === 'string'; })
        .filter(function (directory) { return onlyDirectories(directory); })
        .forEach(function (directory) {
        return fs.readdirSync(directory)
            .filter(function (directory) { return onlyDirectories(directory); })
            .forEach(function (topic) {
            topics.push(readInTopic(topic, directory + "/" + topic));
        });
    });
    // console.log('t:', util.inspect(topics, {depth:null}));
    var topicPhrases = topics.map(function (topic) { return _.flatten(topic.actions.map(function (action) { return action.phrases; })); });
    var allPhrases = _.chain(topicPhrases).flatten().flatten().value();
    // console.log('ap:', util.inspect(allPhrases, {depth:null}));
    topics.forEach(function (topic) {
        var jsonFile = topic.location + "/../" + topic.topic + ".json";
        try {
            var stringed = fs.readFileSync(jsonFile, 'utf8');
            var parsed = JSON.parse(stringed);
            if (!(_.isEqual(topic.actions.map(function (action) { return action.action; }), _.keys(parsed.classifiers)) &&
                _.isEqual(allPhrases, parsed.allPhrases))) {
                console.log("need to retrain " + topic.topic);
                throw new Error();
            }
            var restored = _.mapValues(parsed.classifiers, function (phrase) { return exports.classifier.restore(phrase); });
            classifiers[topic.topic] = restored;
            console.log("restored " + topic.topic);
        }
        catch (err) {
            classifiers[topic.topic] = GenerateTopicClassifier(topic, allPhrases);
            var savable = {
                classifiers: classifiers[topic.topic],
                allPhrases: allPhrases,
            };
            fs.writeFileSync(jsonFile, JSON.stringify(savable), 'utf8');
        }
    });
    // console.log(classifiers);
    return classifiers;
}
exports.GenerateClassifier = GenerateClassifier;
function readInTopic(topic, directory) {
    // console.log('dir', directory);
    var actions = [];
    fs.readdirSync(directory)
        .filter(function (file) { return !_.startsWith(file, '.'); })
        .forEach(function (file) {
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
        location: directory,
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
        console.log("training " + key);
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
function checkUsingClassifier(text, classifier, label, topic) {
    var result = classifier.getClassifications(text)[0];
    if (result.label === 'false') {
        return null;
    }
    return {
        label: label.replace(/-/g, ' '),
        topic: topic,
        value: result.value,
    };
}
exports.checkUsingClassifier = checkUsingClassifier;
function runThroughClassifiers(text, classifiers, dump) {
    if (dump === void 0) { dump = false; }
    var filtered = _.map(classifiers, function (classifiers, topic) {
        var trueClassifications = _.map(classifiers, function (classifier, label) { return checkUsingClassifier(text, classifier, label, topic); });
        // console.log(topic, trueClassifications);
        return _.compact(trueClassifications);
    });
    var compacted = _.compact(_.flatten(filtered));
    // if (this && this.debugOn) { console.log('compacted', util.inspect(compacted, { depth: null })); };
    if (dump) {
        console.log('compacted', util.inspect(compacted, { depth: null }));
    }
    if (exports.classifier === natural.LogisticRegressionClassifier) {
        compacted = compacted.filter(function (result) { return result.value > 0.6; });
    }
    // if (this && this.debugOn) { console.log('filtered compacted', util.inspect(compacted, { depth: null })); };
    return compacted;
}
exports.runThroughClassifiers = runThroughClassifiers;
