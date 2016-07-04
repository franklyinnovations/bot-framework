"use strict";
var natural = require('natural');
var _ = require('lodash');
var fs = require('fs');
exports.classifier = natural.LogisticRegressionClassifier;
// export const classifier = natural.BayesClassifier;
function GenerateClassifier(directories) {
    var phrases = {};
    directories.forEach(function (directory) { return fs.readdirSync(directory).forEach(function (file) {
        var key = /(.*).json/.exec(file);
        // console.log(`loading '${key[1]}'`);
        try {
            phrases[key[1]] = require(directory + "/" + file);
        }
        catch (err) {
            throw new Error("Invalid JSON file " + file);
        }
    }); });
    var allPhrases = _.flatten(_.values(phrases));
    var classifiers = _.mapValues(phrases, function (value, key) {
        var thisClassifier = new exports.classifier();
        var otherPhrases = _.difference(allPhrases, value);
        // console.log(value);
        value.forEach(function (phrase) { return thisClassifier.addDocument(phrase, 'true'); });
        otherPhrases.forEach(function (phrase) { return thisClassifier.addDocument(phrase, 'false'); });
        thisClassifier.train();
        // console.log(`--${key}--`);
        var othersChecked = otherPhrases.map(function (phrase) { return thisClassifier.classify(phrase); }).map(function (classified, index) {
            if (classified === 'true') {
                // console.log('other', index, otherPhrases[index], thisClassifier.getClassifications(otherPhrases[index]));
                return otherPhrases[index];
            }
            return null;
        });
        var selfChecked = value.map(function (phrase) { return thisClassifier.classify(phrase); }).map(function (classified, index) {
            if (classified === 'false') {
                // console.log('self', index, value[index], thisClassifier.getClassifications(value[index]));
                return value[index];
            }
            // console.log(value[index], thisClassifier.getClassifications(value[index]));
            return null;
        });
        // console.log('other:', otherPhrases.length, '  self:', value.length);
        // console.log('passed for other', _.compact(othersChecked));
        // console.log('failed for home', _.compact(selfChecked));
        return thisClassifier;
    });
    return classifiers;
}
exports.GenerateClassifier = GenerateClassifier;
